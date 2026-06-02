package com.mado.service;

import com.mado.config.StreamingProperties;
import com.mado.dto.StreamHealthResponse;
import com.mado.entity.Channel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StreamHealthService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final StreamingProperties streamingProperties;

    public StreamHealthResponse forChannel(Channel channel) {
        if (channel.getStreamKey() == null) {
            return StreamHealthResponse.builder().publishing(false).rawMessage("no stream key").build();
        }
        try {
            String xml = restTemplate.getForObject(streamingProperties.getRtmpStatUrl(), String.class);
            if (xml == null || xml.isBlank()) {
                return StreamHealthResponse.builder().publishing(false).rawMessage("empty stat").build();
            }
            return parse(xml, channel.getStreamKey());
        } catch (Exception e) {
            log.debug("RTMP stat fetch failed: {}", e.getMessage());
            return StreamHealthResponse.builder()
                    .publishing(false)
                    .rawMessage("stat unavailable: " + e.getMessage())
                    .build();
        }
    }

    private StreamHealthResponse parse(String xml, String streamKey) throws Exception {
        var doc = DocumentBuilderFactory.newInstance().newDocumentBuilder()
                .parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
        var streams = doc.getElementsByTagName("stream");
        for (int i = 0; i < streams.getLength(); i++) {
            var streamEl = streams.item(i);
            var children = streamEl.getChildNodes();
            String name = null;
            Long bwIn = null;
            Long nclients = null;
            Double frameRate = null;
            Integer width = null;
            Integer height = null;
            Long dropped = null;
            for (int j = 0; j < children.getLength(); j++) {
                var n = children.item(j);
                if (n.getNodeType() != org.w3c.dom.Node.ELEMENT_NODE) {
                    continue;
                }
                String tag = n.getNodeName();
                String text = Optional.ofNullable(n.getTextContent()).map(String::trim).orElse("");
                switch (tag) {
                    case "name" -> name = text;
                    case "bw_in" -> bwIn = parseLong(text);
                    case "nclients" -> nclients = parseLong(text);
                    case "video" -> {
                        var vKids = n.getChildNodes();
                        for (int k = 0; k < vKids.getLength(); k++) {
                            var vn = vKids.item(k);
                            if (vn.getNodeType() != org.w3c.dom.Node.ELEMENT_NODE) {
                                continue;
                            }
                            String vt = vn.getNodeName();
                            String vv = Optional.ofNullable(vn.getTextContent()).map(String::trim).orElse("");
                            switch (vt) {
                                case "frame_rate" -> frameRate = parseDouble(vv);
                                case "width" -> width = parseInt(vv);
                                case "height" -> height = parseInt(vv);
                                case "drop_frames", "dropped_frames" -> dropped = parseLong(vv);
                                default -> {
                                }
                            }
                        }
                    }
                    case "meta" -> {
                        // some builds expose dropped under client/video
                    }
                    default -> {
                    }
                }
            }
            if (streamKey.equals(name)) {
                long droppedFrames = Optional.ofNullable(dropped).orElse(0L);
                int bitrateKbps = bwIn != null ? (int) (bwIn * 8L / 1000L) : 0;
                return StreamHealthResponse.builder()
                        .publishing(true)
                        .streamName(name)
                        .bitrateKbps(bitrateKbps)
                        .fps(frameRate)
                        .droppedFrames(droppedFrames)
                        .width(width)
                        .height(height)
                        .activeSubscribers(nclients != null ? nclients.intValue() : null)
                        .rawMessage(null)
                        .build();
            }
        }
        return StreamHealthResponse.builder().publishing(false).rawMessage("stream not in stat").build();
    }

    private Long parseLong(String s) {
        try {
            return Long.parseLong(s);
        } catch (Exception e) {
            return null;
        }
    }

    private Integer parseInt(String s) {
        try {
            return Integer.parseInt(s.split("\\.")[0]);
        } catch (Exception e) {
            return null;
        }
    }

    private Double parseDouble(String s) {
        try {
            return Double.parseDouble(s);
        } catch (Exception e) {
            return null;
        }
    }
}
