export type PushConfigurationInput = {
  publicKey: string | null;
  privateKey: string | null;
  subject: string | null;
};

export type PushConfiguration = {
  enabled: boolean;
  publicKey: string | null;
};

export function getPushConfiguration(input: PushConfigurationInput): PushConfiguration {
  const enabled = Boolean(input.publicKey && input.privateKey && input.subject);
  return {
    enabled,
    publicKey: enabled ? input.publicKey : null,
  };
}

export function getServerPushConfiguration(): PushConfiguration {
  return getPushConfiguration({
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
    privateKey: process.env.VAPID_PRIVATE_KEY ?? null,
    subject: process.env.VAPID_SUBJECT ?? null,
  });
}
