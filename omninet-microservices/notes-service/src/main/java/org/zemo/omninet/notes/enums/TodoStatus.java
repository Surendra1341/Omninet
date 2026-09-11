package org.zemo.omninet.notes.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum TodoStatus {
    NOT_STARTED(1, "Not Started"),
    IN_PROGRESS(2, "In Progress"),
    COMPLETED(3, "Completed");

    private final Integer id;
    private final String name;

    TodoStatus(Integer id, String name) {
        this.id = id;
        this.name = name;
    }

    @JsonProperty("id")
    public Integer getId() {
        return id;
    }

    @JsonProperty("name")
    public String getName() {
        return name;
    }

    @JsonCreator
    public static TodoStatus fromJson(Object value) {
        if (value == null) return NOT_STARTED;

        if (value instanceof Number n) {
            int targetId = n.intValue();
            for (TodoStatus s : values()) {
                if (s.id.equals(targetId)) return s;
            }
        }

        if (value instanceof String str) {
            String clean = str.trim().toUpperCase().replace(" ", "_");
            for (TodoStatus s : values()) {
                if (s.name().equalsIgnoreCase(clean)
                        || s.getName().equalsIgnoreCase(str.trim())
                        || (s == IN_PROGRESS && str.toLowerCase().contains("prog"))
                        || (s == COMPLETED && str.toLowerCase().contains("complet"))) {
                    return s;
                }
            }
        }

        if (value instanceof Map<?, ?> map) {
            Object idVal = map.get("id");
            if (idVal instanceof Number n) {
                return fromJson(n);
            }
            Object nameVal = map.get("name");
            if (nameVal instanceof String s) {
                return fromJson(s);
            }
        }

        return NOT_STARTED;
    }
}
