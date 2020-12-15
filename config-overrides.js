module.exports = function override(config, env) {
   config.module.rules.push({
       test: /\.worker\.(js|ts|tsx)$/,
       use: { loader: 'worker-loader'}
   })
   config.output.globalObject = "self";
    return config;
};