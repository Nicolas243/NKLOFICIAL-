import assert from 'node:assert/strict';
import test from 'node:test';
import {
  describeMicro1Opportunity,
  formatMicro1CompactSummary,
  formatMicro1Pay,
  getMicro1Categories,
  getMicro1FilterOptions,
  getMicro1Opportunities,
  matchesMicro1QuickFilter,
  translateMicro1Title,
  type Micro1Opportunity,
} from '../micro1-opportunities';

const sampleOpportunity: Micro1Opportunity = {
  jobId: 'job-1',
  jobName: 'Senior Software Engineer (Brazil)',
  companyName: 'micro1',
  datePosted: null,
  openings: 3,
  highDemand: true,
  roleType: 'expert',
  jobType: 'REGULAR',
  domainSlug: 'software-engineering',
  skills: ['TypeScript', 'AI'],
  referralRewardUsd: 100,
  applyUrl: 'https://jobs.micro1.ai/post/job-1',
  hourlyRate: { min: 20, max: 40 },
  monthlySalary: null,
  yearlyCompensation: null,
};

test('translates common role terms without hiding the original title', () => {
    assert.equal(translateMicro1Title(sampleOpportunity.jobName), 'Engenheiro de software sênior (Brasil)');
    assert.equal(translateMicro1Title('Lawyer'), 'Advogado');
    assert.equal(translateMicro1Title('General Counsel'), 'Diretor jurídico');
    assert.equal(translateMicro1Title('Image Annotator'), 'Anotador de imagens');
});

test('formats compact PT-BR project descriptions with at most 7 words and no English job titles', () => {
  const cases: Micro1Opportunity[] = [
    sampleOpportunity,
    { ...sampleOpportunity, jobId: 'law-1', jobName: 'Lawyer', domainSlug: 'law' },
    { ...sampleOpportunity, jobId: 'law-2', jobName: 'General Counsel', domainSlug: 'law' },
    { ...sampleOpportunity, jobId: 'img-1', jobName: 'Image Annotator', domainSlug: 'generalist' },
    { ...sampleOpportunity, jobId: 'tax-1', jobName: 'Senior Tax Reviewer', domainSlug: 'other' },
    { ...sampleOpportunity, jobId: 'med-1', jobName: 'Radiation Oncologist', domainSlug: 'medicine' },
    { ...sampleOpportunity, jobId: 'vid-1', jobName: 'At-Home Video Recorder (LATAM)', domainSlug: 'robotics' },
  ];

  for (const item of cases) {
    const summary = formatMicro1CompactSummary(item);
    const words = summary.trim().split(/\s+/u).filter(Boolean);
    assert.ok(words.length >= 2 && words.length <= 7, `"${summary}" must have 2..7 words`);
    assert.doesNotMatch(summary, /\b(Lawyer|Counsel|Annotator|Reviewer|Oncologist|Recorder|Engineer)\b/i);
  }
});

test('groups all opportunities by domain', () => {
    const categories = getMicro1Categories([
      sampleOpportunity,
      { ...sampleOpportunity, jobId: 'job-2', domainSlug: 'language-audio' },
      { ...sampleOpportunity, jobId: 'job-3', domainSlug: 'language-audio' },
    ]);

    assert.deepEqual(categories[0], { slug: 'language-audio', count: 2, label: 'Idiomas e áudio' });
    assert.deepEqual(categories[1], { slug: 'software-engineering', count: 1, label: 'Tecnologia e programação' });
});

test('shows original USD pay and clearly approximate BRL conversion', () => {
    assert.deepEqual(formatMicro1Pay(sampleOpportunity), {
      original: 'US$ 20–40/hora',
      estimatedBrl: '≈ R$ 104–208/hora',
    });
});

test('uses a domain-specific Portuguese explanation', () => {
    assert.match(describeMicro1Opportunity(sampleOpportunity), /experiência em tecnologia/u);
});

test('places quick filters before the Micro1 specialties', () => {
    const options = getMicro1FilterOptions([
      sampleOpportunity,
      { ...sampleOpportunity, jobId: 'job-2', jobName: 'Video Recorder', roleType: 'generalist' },
      { ...sampleOpportunity, jobId: 'job-3', jobName: 'Data Reviewer', roleType: null },
    ]);

    assert.deepEqual(options.slice(0, 4).map((option) => option.slug), ['portugues', 'facil', 'medio', 'avancado']);
    assert.equal(options.find((option) => option.slug === 'portugues')?.count, 1);
    assert.equal(options.find((option) => option.slug === 'facil')?.count, 1);
    assert.equal(options.find((option) => option.slug === 'medio')?.count, 1);
});

test('matches Portuguese and editorial difficulty filters', () => {
    assert.equal(matchesMicro1QuickFilter(sampleOpportunity, 'portugues'), true);
    assert.equal(matchesMicro1QuickFilter(sampleOpportunity, 'avancado'), true);
    assert.equal(matchesMicro1QuickFilter({ ...sampleOpportunity, roleType: 'generalist' }, 'facil'), true);
    assert.equal(matchesMicro1QuickFilter({ ...sampleOpportunity, roleType: null }, 'medio'), true);
});

test('fetches with AbortSignal timeout and returns deduplicated items when live total exceeds unique count', async () => {
    const observedSignals: Array<AbortSignal | null | undefined> = [];
    const mockFetch: typeof fetch = async (_input, init) => {
      observedSignals.push(init?.signal);
      return new Response(
        JSON.stringify({
          status: true,
          total: 3,
          data: [
            {
              job_id: 'job-1',
              job_name: 'Senior Software Engineer (Brazil)',
              apply_url: 'https://jobs.micro1.ai/post/job-1',
              domain_slug: 'software-engineering',
            },
            {
              job_id: 'job-1',
              job_name: 'Senior Software Engineer (Brazil)',
              apply_url: 'https://jobs.micro1.ai/post/job-1',
              domain_slug: 'software-engineering',
            },
            {
              job_id: 'job-2',
              job_name: 'Video Recorder',
              apply_url: 'https://jobs.micro1.ai/post/job-2',
              domain_slug: 'robotics',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };

    const result = await getMicro1Opportunities(mockFetch);
    assert.equal(result.length, 2);
    assert.deepEqual(result.map((item) => item.jobId), ['job-1', 'job-2']);
    assert.equal(observedSignals.length, 1);
    assert.ok(observedSignals[0] instanceof AbortSignal);
});
