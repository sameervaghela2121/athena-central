# For Dev

docker build --build-arg BUILD_ENV=dev -t client-frontend:dev .

# For QA

docker build --build-arg BUILD_ENV=qa -t client-frontend:qa .

# For UAT

docker build --build-arg BUILD_ENV=uat -t client-frontend:uat .

# For Production

docker build --build-arg BUILD_ENV=prod -t client-frontend:prod .

# Run docker locally

docker run -p 3000:80 client-frontend:qa <-- docker REPOSITORY name with TAG NAME

# How to deploy docker image on server

2. docker tag client-frontend:latest gcr.io/dev-genai-sandbox-434618/vp-k8-frontend
3. docker push gcr.io/dev-genai-sandbox-434618/vp-k8-frontend
