#!/usr/bin/env bash

# This program is distributed under the terms of the MIT license:
# <https://github.com/v0lkan/talks/blob/master/LICENSE.md>
# Send your comments and suggestions to <me@volkan.io>.

# 007 - Node.JS as a Service

docker rm -f fluent_rabbit
docker rm -f fluent_web
docker rm -f fluent_compute
docker rm -f fluent_app
docker rm -f fluent_bastion

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "${DIR}"

# RabbitMQ
docker run -d --hostname fluent-rabbit \
--name fluent_rabbit \
-p 15672:15672 \
rabbitmq:3-management

# Simulates “the Internet”
docker run --privileged -i -t -d \
-h service-static-server \
--name fluent_web \
-v "${DIR}/../../containers/common/opt/shared":/opt/shared \
-v "${DIR}/../../containers/common/data":/data \
-v "${DIR}/../../containers/static-server/opt/fluent":/opt/fluent \
-v "${DIR}/../../containers/static-server/etc/nginx/sites-enabled":/etc/nginx/sites-enabled \
-v "${DIR}/../../containers/static-server/var/www":/var/www \
fluent:service-static-server /bin/bash

# The Compute Service
docker run -d --privileged -i -t \
-h service-compute \
--name fluent_compute \
-v "${DIR}/../../containers/common/opt/shared":/opt/shared \
-v "${DIR}/../../containers/common/data":/data \
-v "${DIR}/../../containers/007-demo-nodejs-as-a-service/compute/opt/fluent":/opt/fluent \
-v "${DIR}/../../containers/007-demo-nodejs-as-a-service/compute/var/log/fluent":/var/log/fluent \
--link fluent_rabbit:rabbit \
--link fluent_web:web \
fluent:service-compute /bin/bash

# The API Service
docker run -d --privileged -i -t \
-h service-app \
--name fluent_app \
-v "${DIR}/../../containers/common/opt/shared":/opt/shared \
-v "${DIR}/../../containers/common/data":/data \
-v "${DIR}/../../containers/007-demo-nodejs-as-a-service/service/opt/fluent":/opt/fluent \
-v "${DIR}/../../containers/007-demo-nodejs-as-a-service/service/var/log/fluent":/var/log/fluent \
--link fluent_rabbit:rabbit \
-p 8003:8003 \
-p 5858:5858 \
fluent:service-app /bin/bash

docker run -d --privileged -i -t --cpuset-cpus="0" \
-h bastion \
--name fluent_bastion \
-v "${DIR}/../../containers/common/opt/shared":/opt/shared \
-v "${DIR}/../../containers/common/data":/data \
-v "${DIR}/../../containers/bastion/opt/fluent":/opt/fluent \
-v "${DIR}/../../containers":/containers \
--link fluent_compute:compute \
--link fluent_app:app \
-p 4322:4322 \
fluent:bastion /bin/bash

echo "Set up the cluster."
