declare module 'swagger-ui-dist/swagger-ui-es-bundle.js' {
  interface SwaggerUIOptions {
    domNode: HTMLElement;
    spec: any;
    deepLinking?: boolean;
  }

  interface SwaggerUIInstance {
    destroy?: () => void;
  }

  function SwaggerUI(options: SwaggerUIOptions): SwaggerUIInstance;

  const defaultExport: typeof SwaggerUI;
  export default defaultExport;
  export {SwaggerUI};
}