.PHONY: env

env: | _env-validate
	$(eval include .config/$(env).env)

secret-env: | _secret-env-validate
	$(eval include $(SECRET_DIR)/secret.env)

_env-validate:
ifeq ($(filter $(env),$(ENVS)),)
	@echo "ERROR: env is required. supported: $(ENVS)"
	@exit 1
endif

_secret-env-validate:
	@[ -f $(SECRET_DIR)/secret.env ] ||  (echo "ERROR: .secret/$(env)/secret.env is not found." && exit 1)

