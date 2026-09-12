package org.zemo.omninet.ai.tools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@Slf4j
public class ToolRegistry {

    private final Map<String, AiTool> toolMap = new HashMap<>();

    public ToolRegistry(List<AiTool> tools) {
        for (AiTool tool : tools) {
            toolMap.put(tool.getName(), tool);
            log.info("Registered AI tool: {}", tool.getName());
        }
    }

    public Optional<AiTool> getTool(String name) {
        return Optional.ofNullable(toolMap.get(name));
    }

    public List<Map<String, Object>> getGeminiToolsDeclaration() {
        List<Map<String, Object>> functionDeclarations = new ArrayList<>();
        for (AiTool tool : toolMap.values()) {
            Map<String, Object> decl = new HashMap<>();
            decl.put("name", tool.getName());
            decl.put("description", tool.getDescription());
            decl.put("parameters", tool.getParameterSchema());
            functionDeclarations.add(decl);
        }
        return List.of(Map.of("functionDeclarations", functionDeclarations));
    }

    public AiTool.ToolResult executeTool(String toolName, Map<String, Object> args) {
        AiTool tool = toolMap.get(toolName);
        if (tool == null) {
            log.warn("Tool not found: {}", toolName);
            return new AiTool.ToolResult(false, "Tool " + toolName + " not found.", null);
        }
        log.info("Executing AI tool: {} with args: {}", toolName, args);
        return tool.execute(args != null ? args : Collections.emptyMap());
    }
}
