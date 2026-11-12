import type { NklRole, NklRouterConfig } from "./nkl-router-config.js";
import {
  runNklRoleTask,
  type NklEvidence,
  type NklRoleResult,
} from "./nkl-router-runner.js";

const WORKER_PROMPTS = [
  "Inspect the task from the implementation and code-structure perspective. Cite only relevant paths and line ranges.",
  "Inspect the task from the behavior, user-flow, and regression perspective. Cite only relevant paths and line ranges.",
  "Inspect the task from the safety, configuration, and integration perspective. Cite only relevant paths and line ranges.",
] as const;

export interface NklOrchestrationResult {
  status: "completed" | "incomplete" | "failed";
  text: string;
  plan: string;
  workers: NklRoleResult[];
  review: NklRoleResult;
  fallbackUsed: boolean;
}

export interface OrchestratorDependencies {
  config: NklRouterConfig;
  runRole?: (role: NklRole, prompt: string) => Promise<NklRoleResult>;
}

export async function orchestrateNklTask(
  task: string,
  deps: OrchestratorDependencies,
): Promise<NklOrchestrationResult> {
  const runRole =
    deps.runRole ??
    ((role: NklRole, prompt: string) =>
      runNklRoleTask(role, prompt, { config: deps.config }));
  const coordinator = await runRole(
    "orchestrator",
    `Create a compact plan for this repository task. Identify the objective, likely files, worker questions, and review criteria. Do not edit files or include file contents.\n\nTask: ${task}`,
  );
  const plan =
    coordinator.status === "completed" && coordinator.text
      ? coordinator.text
      : "Coordinator unavailable; workers must provide bounded independent evidence.";

  const workerPrompts = uniquePrompts(
    WORKER_PROMPTS.map(
      (focus) =>
        `${focus}\n\nCompact coordinator plan:\n${boundText(plan, 3_000)}\n\nTask: ${task}`,
    ),
  ).slice(0, deps.config.router.maxWorkers);
  let fallbackUsed = coordinator.status !== "completed";
  const workers = await Promise.all(
    workerPrompts.map(async (prompt) => {
      const firstAttempt = await runRole("worker", prompt);
      if (firstAttempt.status !== "failed" && firstAttempt.status !== "aborted") {
        return firstAttempt;
      }

      const retry = await runRole(
        "worker",
        `${prompt}\n\nRetry once using a different eligible route. Return only compact findings and citations.`,
      );
      if (retry.status === "completed") {
        return retry;
      }

      fallbackUsed = true;
      return {
        role: "worker",
        status: "fallback",
        text: "Coordinator will complete the remaining worker analysis.",
        evidence: [],
        uncertainty: "The worker failed after one retry.",
      } satisfies NklRoleResult;
    }),
  );

  const compactWorkers = compactResults(workers);
  const review = await runRole(
    "reviewer",
    [
      "Review the compact plan and worker findings. Do not request or reproduce full file contents.",
      `PLAN:\n${boundText(plan, 3_000)}`,
      `WORKERS:\n${JSON.stringify(compactWorkers)}`,
      "Return only review conclusions, unresolved risks, and cited paths.",
    ].join("\n\n"),
  );
  const status =
    deps.config.router.reviewerRequired && review.status !== "completed"
      ? "incomplete"
      : "completed";

  return {
    status,
    text: synthesizeText(plan, compactWorkers, review),
    plan,
    workers: compactWorkers,
    review,
    fallbackUsed,
  };
}

function compactResults(results: NklRoleResult[]): NklRoleResult[] {
  const seenEvidence = new Set<string>();
  return results.map((result) => {
    const evidence = result.evidence.filter((item) => {
      const key = evidenceKey(item);
      if (seenEvidence.has(key)) {
        return false;
      }
      seenEvidence.add(key);
      return true;
    });
    return {
      ...result,
      text: boundText(result.text, 4_000),
      evidence,
      ...(result.uncertainty
        ? { uncertainty: boundText(result.uncertainty, 500) }
        : {}),
    };
  });
}

function synthesizeText(
  plan: string,
  workers: NklRoleResult[],
  review: NklRoleResult,
): string {
  const workerText = workers
    .map((worker, index) => `Worker ${index + 1}: ${worker.text}`)
    .join("\n");
  return boundText(
    [
      `Plan: ${boundText(plan, 2_000)}`,
      workerText,
      `Review: ${review.text}`,
    ]
      .filter(Boolean)
      .join("\n"),
    8_000,
  );
}

function evidenceKey(item: NklEvidence): string {
  return `${item.path}\0${item.lines ?? ""}\0${item.note}`;
}

function uniquePrompts(prompts: string[]): string[] {
  return [...new Set(prompts.map((prompt) => prompt.trim()).filter(Boolean))];
}

function boundText(value: string, maximum: number): string {
  return value.length <= maximum ? value : `${value.slice(0, maximum)}…`;
}
