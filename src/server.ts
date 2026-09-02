import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { createSeoInfrastructureResponse, withErrorNoindex } from "./seo/seo-server";
import { createP10InfrastructureResponse } from "./seo/p10-seo-infrastructure";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry")
      .then((m) => (m.default ?? m) as ServerEntry)
      .catch((error) => {
        serverEntryPromise = undefined;
        throw error;
      });
  }
  return serverEntryPromise;
}

function createCatastrophicErrorResponse() {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
    },
  });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return createCatastrophicErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const p10Response = await createP10InfrastructureResponse(request);
    if (p10Response) return p10Response;
    const infrastructureResponse = createSeoInfrastructureResponse(request);
    if (infrastructureResponse) return infrastructureResponse;

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return withErrorNoindex(normalized);
    } catch (error) {
      console.error(error);
      return withErrorNoindex(createCatastrophicErrorResponse());
    }
  },
};
