#!/usr/bin/env bash

OPTION="${1}"

DOCKER_MACHINE_CMD=`which docker-machine`
DOCKER_CMD=`which docker`
DOCKER_IMAGE_NAME="zboxapp/docker-matrix"

MATRIX_DATA_VOL_PATH="`pwd`/test/fixtures/matrix_data"
MATRIX_DB_FILE="$MATRIX_DATA_VOL_PATH/homeserver.db"


# -------------------
function start_matrix_docker {
	eval "$($DOCKER_MACHINE_CMD env $MACHINE_NAME)"
	echo ":: Updating ${DOCKER_IMAGE_NAME}"
	$DOCKER_CMD stop docker-matrix 2>/dev/null || true
	$DOCKER_CMD rm docker-matrix 2>/dev/null || true
	$DOCKER_CMD pull $DOCKER_IMAGE_NAME > /dev/null
	$DOCKER_CMD run -d --name docker-matrix -p 8448:8448 -p 8008:8008 -v $MATRIX_DATA_VOL_PATH:/data $DOCKER_IMAGE_NAME start
	echo ":: The Matrix Server is Ready"
	VM_IP=`${DOCKER_MACHINE_CMD} ip ${MACHINE_NAME}`

	echo ""
	echo ""
	echo ":: The BaseUrl is https://${VM_IP}:8448"
}

function initialize_matrix_docker {
	if [ ! -f "${MATRIX_DATA_VOL_PATH}" ]; then
		echo ":: MATRIX Data Path no exists. Creating it now..."
		mkdir -p $MATRIX_DATA_VOL_PATH
	fi
		
	echo ":: First time running this. Configuring Matrix now..."
	$DOCKER_CMD stop docker-matrix 2>/dev/null || true
	$DOCKER_CMD rm docker-matrix 2>/dev/null || true
	$DOCKER_CMD run -v $MATRIX_DATA_VOL_PATH:/data --rm -e SERVER_NAME=zboxapp.dev -e REPORT_STATS=no $DOCKER_IMAGE_NAME generate
	cp -af ./test/vendors/homeserver.yaml $MATRIX_DATA_VOL_PATH/homeserver.yaml
	echo ":: Configuration Ready. Starting Server..."
	$DOCKER_CMD run -d --name docker-matrix -p 8448:8448 -p 8008:8008 -v $MATRIX_DATA_VOL_PATH:/data $DOCKER_IMAGE_NAME start
	sleep 10
	echo ":: Creating user test with password 123456"
	$DOCKER_CMD exec -ti docker-matrix /usr/bin/register_new_matrix_user -c /data/homeserver.yaml https://127.0.0.1:8448 -u test -p 123456 -a
	$DOCKER_CMD stop docker-matrix 2>/dev/null || true
	$DOCKER_CMD rm docker-matrix 2>/dev/null || true
}

if [ ! -f "${DOCKER_MACHINE_CMD}" ]; then
	echo ":: You need to install Docker Machine First"
	exit 1
fi

if [ -z "${MACHINE_NAME}" ]; then
	echo ":: No VM on MACHINE_NAME variable. Using default"
	MACHINE_NAME="default"
fi

VM_STATUS=`docker-machine ls | grep "${MACHINE_NAME}" | awk '{print $4}'`

if [ -z "${VM_STATUS}" ]; then
	echo ":: No VM with name $MACHINE_NAME. Install one firts"
	exit 1
fi

if [ $VM_STATUS = "Stopped" ]; then
	echo ":: VM Stopped, starting $MACHINE_NAME now..."
	$DOCKER_MACHINE_CMD start $MACHINE_NAME 
	eval "$($DOCKER_MACHINE_CMD env $MACHINE_NAME)"
	
	echo ""
	echo ":: Pulling last version of $DOCKER_IMAGE_NAME"
	$DOCKER_CMD pull $DOCKER_IMAGE_NAME > /dev/null


	if [ ! -f "${MATRIX_DB_FILE}" ]; then
		initialize_matrix_docker
	fi

	start_matrix_docker

fi

if [ $VM_STATUS = "Running" ]; then
	if [ ! -f "${MATRIX_DB_FILE}" ]; then
		initialize_matrix_docker
	fi

	start_matrix_docker
fi

echo ":: You can start hacking now!!"
