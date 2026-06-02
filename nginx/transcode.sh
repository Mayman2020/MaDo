#!/bin/sh
# Transcodes an incoming RTMP stream to multi-bitrate HLS.
# Called by nginx-rtmp exec_push with the stream name as $1.
NAME="$1"
echo "[transcode] started NAME='$NAME' at $(date)" >> /var/log/transcode-debug.log 2>&1
[ -z "$NAME" ] && echo "[transcode] ERROR: NAME is empty, aborting" >> /var/log/transcode-debug.log && exit 1

mkdir -p \
  "/var/hls/$NAME/1080p" \
  "/var/hls/$NAME/720p"  \
  "/var/hls/$NAME/480p"  \
  "/var/hls/$NAME/360p"

cat > "/var/hls/$NAME/index.m3u8" << 'EOF'
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=4500000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
1080p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=854x480,CODECS="avc1.64001e,mp4a.40.2"
480p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=600000,RESOLUTION=640x360,CODECS="avc1.64001e,mp4a.40.2"
360p/index.m3u8
EOF

echo "[transcode] launching ffmpeg for $NAME" >> /var/log/transcode-debug.log 2>&1
exec ffmpeg -i "rtmp://localhost/live/$NAME" \
  -c:v libx264 -preset veryfast -b:v 4500k -maxrate 4500k -bufsize 9000k \
    -vf scale=1920:1080 -r 60 -g 120 -c:a aac -b:a 192k -ar 44100 \
    -hls_time 2 -hls_list_size 5 -hls_flags delete_segments \
    -f hls "/var/hls/$NAME/1080p/index.m3u8" \
  -c:v libx264 -preset veryfast -b:v 2500k -maxrate 2500k -bufsize 5000k \
    -vf scale=1280:720  -r 60 -g 120 -c:a aac -b:a 128k -ar 44100 \
    -hls_time 2 -hls_list_size 5 -hls_flags delete_segments \
    -f hls "/var/hls/$NAME/720p/index.m3u8" \
  -c:v libx264 -preset veryfast -b:v 1200k -maxrate 1200k -bufsize 2400k \
    -vf scale=854:480   -r 30 -g 60  -c:a aac -b:a 96k  -ar 44100 \
    -hls_time 2 -hls_list_size 5 -hls_flags delete_segments \
    -f hls "/var/hls/$NAME/480p/index.m3u8" \
  -c:v libx264 -preset veryfast -b:v 600k  -maxrate 600k  -bufsize 1200k \
    -vf scale=640:360   -r 30 -g 60  -c:a aac -b:a 64k  -ar 44100 \
    -hls_time 2 -hls_list_size 5 -hls_flags delete_segments \
    -f hls "/var/hls/$NAME/360p/index.m3u8" \
  >> "/var/log/ffmpeg-$NAME.log" 2>&1
