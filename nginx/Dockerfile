FROM nginx:alpine

# remove default nginx configuration
RUN rm -f /etc/ngin/conf.d/default.conf

# copy my own nginx configuration (west.conf)
COPY west.conf /etc/nginx/conf.d/west.conf