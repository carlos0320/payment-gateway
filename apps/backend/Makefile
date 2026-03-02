build-BackendFunction:
	# Install deps (dev deps included so nest build works)
	npm install
	# Build TS -> dist/
	npm run build
	# Copy build output into SAM artifacts
	cp -R dist $(ARTIFACTS_DIR)/
	cp package.json $(ARTIFACTS_DIR)/
	# Install prod deps into artifacts (smaller)
	npm install --omit=dev --prefix $(ARTIFACTS_DIR)

clean:
	rm -rf dist