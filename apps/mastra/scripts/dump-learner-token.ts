import { signDevToken } from "../src/mastra/server/auth";

const token = await signDevToken({
  sub: process.env.LEARNER_ID ?? "learner-smoketest",
  organizationId: process.env.LEARNER_ORG ?? "org-smoketest",
  role: "user",
});
process.stdout.write(token);
