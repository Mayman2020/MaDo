FROM alfg/nginx-rtmp:latest

# Override CMD so we skip the base image's envsubst entrypoint.
# Our nginx.conf uses nginx-rtmp's built-in $name variable which envsubst
# incorrectly strips (it treats every $VAR as a substitution candidate).
COPY nginx.conf /etc/nginx/nginx.conf
COPY transcode.sh /etc/nginx/transcode.sh

RUN chmod +x /etc/nginx/transcode.sh && mkdir -p /var/hls /var/log/nginx

# Skip envsubst; start nginx directly with our pre-processed config.
CMD ["nginx", "-g", "daemon off;"]
