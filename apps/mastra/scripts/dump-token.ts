import { signDevToken } from "../src/mastra/server/auth";

const token = await signDevToken({
  sub: "user-smoketest",
  organizationId: "org-smoketest",
  role: "admin",
});
process.stdout.write(token);
