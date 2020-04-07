local k = import "ksonnet.beta.4/k.libsonnet";
local container = k.extensions.v1beta1.deployment.mixin.spec.template.spec.containersType;
local deployment = k.apps.v1.deployment;

local podLabels = {
  app: "redis-test"
};
local redisTest =
  container.new("redis-test", "logdnalf/redis_test:latest") +
  container.withImagePullPolicy('Always') +
  container.withEnv({
    name: 'DEBUG',
    value: 'ioredis:connection'
  });
local redisTestDeployment = deployment.new("redis-test", 1, redisTest, podLabels) +
  deployment.mixin.spec.template.spec.securityContext.withRunAsUser(1000) +
  deployment.mixin.spec.template.spec.securityContext.withRunAsGroup(1000) +
  deployment.mixin.spec.template.spec.securityContext.withFsGroup(1000) +
  deployment.mixin.spec.template.spec.withTerminationGracePeriodSeconds(10) +
  deployment.mixin.spec.selector.withMatchLabels(podLabels);

//DEBUG=ioredis:*

k.core.v1.list.new(redisTestDeployment)