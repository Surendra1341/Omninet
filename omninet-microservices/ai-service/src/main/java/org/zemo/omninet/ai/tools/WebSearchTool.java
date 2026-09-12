package org.zemo.omninet.ai.tools;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Slf4j
public class WebSearchTool implements AiTool {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getName() {
        return "web_search";
    }

    @Override
    public String getDescription() {
        return "Search the web for up-to-date information, news, current events, technical documentation, websites, and facts.";
    }

    @Override
    public Map<String, Object> getParameterSchema() {
        return Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "query", Map.of(
                                "type", "STRING",
                                "description", "The specific search query string"
                        )
                ),
                "required", List.of("query")
        );
    }

    @Override
    public ToolResult execute(Map<String, Object> arguments) {
        String query = (String) arguments.get("query");
        if (query == null || query.isBlank()) {
            return new ToolResult(false, "No search query provided.", Collections.emptyList());
        }

        List<Map<String, String>> citations = new ArrayList<>();
        StringBuilder content = new StringBuilder("Web Search Results for: \"" + query + "\"\n\n");

        try {
            // 1. First, search DuckDuckGo HTML / Lite for live web pages
            searchDuckDuckGo(query, citations);

            // 2. Also search Wikipedia API for reference definitions / encyclopedic facts
            searchWikipedia(query, citations);

            if (citations.isEmpty()) {
                // Fallback search snippet if external engines rate-limit
                Map<String, String> fallbackSource = Map.of(
                        "id", "1",
                        "title", "Search Overview: " + query,
                        "url", "https://duckduckgo.com/?q=" + URLEncoder.encode(query, StandardCharsets.UTF_8),
                        "snippet", "Direct search link for live updates and information on " + query
                );
                citations.add(fallbackSource);
            }

            int index = 1;
            for (Map<String, String> cit : citations) {
                cit.put("id", String.valueOf(index));
                content.append("[").append(index).append("] ").append(cit.get("title")).append("\n");
                content.append("URL: ").append(cit.get("url")).append("\n");
                content.append("Summary: ").append(cit.get("snippet")).append("\n\n");
                index++;
            }

            return new ToolResult(true, content.toString(), citations);
        } catch (Exception e) {
            log.error("Web search execution failed: {}", e.getMessage());
            return new ToolResult(false, "Web search error: " + e.getMessage(), Collections.emptyList());
        }
    }

    private void searchDuckDuckGo(String query, List<Map<String, String>> citations) {
        try {
            String url = "https://html.duckduckgo.com/html/?q=" + URLEncoder.encode(query, StandardCharsets.UTF_8);
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String html = response.getBody();

                Pattern linkPattern = Pattern.compile("<a class=\"result__url\"[^>]*href=\"[^\"]*uddg=([^&\"]+)[^>]*>(.*?)</a>", Pattern.DOTALL);
                Pattern snipPattern = Pattern.compile("<a class=\"result__snippet\"[^>]*>(.*?)</a>", Pattern.DOTALL);

                Matcher linkMatcher = linkPattern.matcher(html);
                Matcher snipMatcher = snipPattern.matcher(html);

                int count = 0;
                while (linkMatcher.find() && snipMatcher.find() && count < 3) {
                    String rawUrl = linkMatcher.group(1);
                    String cleanUrl = URLDecoder.decode(rawUrl, StandardCharsets.UTF_8);
                    String rawTitle = linkMatcher.group(2).replaceAll("<[^>]+>", "").trim();
                    String cleanSnippet = snipMatcher.group(1).replaceAll("<[^>]+>", "").trim();

                    if (!cleanUrl.isBlank() && !cleanSnippet.isBlank()) {
                        Map<String, String> item = new HashMap<>();
                        item.put("title", !rawTitle.isBlank() ? rawTitle : cleanUrl);
                        item.put("url", cleanUrl);
                        item.put("snippet", cleanSnippet);
                        citations.add(item);
                        count++;
                    }
                }
            }
        } catch (Exception e) {
            log.debug("DuckDuckGo search pass: {}", e.getMessage());
        }
    }

    private void searchWikipedia(String query, List<Map<String, String>> citations) {
        try {
            String url = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch="
                    + URLEncoder.encode(query, StandardCharsets.UTF_8)
                    + "&format=json&utf8=1&srlimit=2";

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "OmniNet-AI-Assistant/1.0 (https://omninet.security)");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode searchArray = root.path("query").path("search");
                if (searchArray.isArray()) {
                    for (JsonNode node : searchArray) {
                        if (citations.size() >= 4) break;
                        String title = node.path("title").asText();
                        String snippet = node.path("snippet").asText().replaceAll("<[^>]+>", "").trim();
                        String pageUrl = "https://en.wikipedia.org/wiki/" + URLEncoder.encode(title.replace(" ", "_"), StandardCharsets.UTF_8);

                        Map<String, String> item = new HashMap<>();
                        item.put("title", title + " - Wikipedia");
                        item.put("url", pageUrl);
                        item.put("snippet", snippet);
                        citations.add(item);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Wikipedia search pass: {}", e.getMessage());
        }
    }
}
