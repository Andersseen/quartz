import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';

const angularApp = new AngularNodeAppEngine();

export const reqHandler = createNodeRequestHandler(async (req, res, next) => {
  try {
    const response = await angularApp.handle(req);
    if (response) writeResponseToNodeResponse(response, res);
    else next();
  } catch (error) {
    next(error);
  }
});
