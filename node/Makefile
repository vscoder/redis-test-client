bootstrap:
	brew install jsonnet sshuttle kubernetes-cli
	jb install

test.yaml: test.jsonnet
	jsonnet -J vendor/ test.jsonnet > test.yaml

apply: test.yaml
	kubectl apply -f test.yaml

delete: test.yaml
	kubectl delete -f test.yaml

logs: apply
	kubectl wait --for=condition=available --timeout=600s deployment/redis-test
	kubectl logs -f -l app=redis-test

image: Dockerfile
	docker build -t $(USER)/redis_test .

push: image
	docker push $(USER)/redis_test
