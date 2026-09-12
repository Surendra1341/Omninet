package org.zemo.omninet.ai.tools;

import java.util.Map;

public interface AiTool {
    /**
     * Unique function name (e.g. "web_search", "calculate").
     */
    String getName();

    /**
     * Human-readable description explaining when the model should call this tool.
     */
    String getDescription();

    /**
     * JSON Schema representing parameters (type, properties, required).
     */
    Map<String, Object> getParameterSchema();

    /**
     * Execute the tool with arguments and return result map.
     */
    ToolResult execute(Map<String, Object> arguments);

    record ToolResult(
            boolean success,
            String content,
            Object structuredData
    ) {}
}
