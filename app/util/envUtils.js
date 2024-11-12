/** Check if application is running in a dev environment. RUN_ENV is defined in kubernetes-deploy for dev instances. For running dev locally, NODE_ENV is checked * */
export const isDevelopmentEnvironment = config => {
  return (
    config?.RUN_ENV === 'development' || process.env.NODE_ENV === 'development'
  );
};
