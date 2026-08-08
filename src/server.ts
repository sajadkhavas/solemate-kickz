import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

import { createSeoInfrastructureResponse, withErrorNoindex } from "./seo/seo-server";

export default createServerEntry({
  async fetch(request) {
    const infrastructureResponse = createSeoInfrastructureResponse(request);
    if (infrastructureResponse) return infrastructureResponse;

    const response = await handler.fetch(request);
    return withErrorNoindex(response);
  },
});
