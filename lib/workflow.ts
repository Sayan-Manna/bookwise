import { Client as WorkflowClient } from "@upstash/workflow";
import { Client as QStashClient } from "@upstash/qstash";
import config from "@/lib/config";

export const workflowClient = new WorkflowClient({
  baseUrl: config.env.upstash.qstashUrl,
  token: config.env.upstash.qstashToken,
});

const qstashClient = new QStashClient({
  token: config.env.upstash.qstashToken,
});

export const sendEmail = async ({ email, subject, message }: { email: string; subject: string; message: string }) => {
  await qstashClient.publishJSON({
    url: `${config.env.apiEndpoint}/api/send-email`, // Your API endpoint
    body: {
      to: email,
      subject,
      html: message,
    },
    retries: 3, // Optional retry configuration
  });
};
