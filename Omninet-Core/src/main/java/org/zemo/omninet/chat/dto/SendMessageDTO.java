package org.zemo.omninet.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.web.util.HtmlUtils;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageDTO {

    @NotBlank(message = "Receiver email cannot be blank")
    @Email(message = "Invalid email format")
    private String receiverEmail;

    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 4000, message = "Message content cannot exceed 4000 characters")
    private String content;

    // Sanitize content to prevent XSS attacks
    public void setContent(String content) {
        this.content = content != null ? HtmlUtils.htmlEscape(content.trim()) : null;
    }

    // Validate and sanitize receiver email
    public void setReceiverEmail(String receiverEmail) {
        this.receiverEmail = receiverEmail != null ? receiverEmail.trim().toLowerCase() : null;
    }
}
