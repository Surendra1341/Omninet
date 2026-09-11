package org.zemo.omninet.ai.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.zemo.omninet.ai.dto.SpeechRecognizeResponse;
import org.zemo.omninet.ai.service.AiService;
import org.zemo.omninet.common.dto.ApiResponse;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/ai/speech", "/api/ai/speech"})
@RequiredArgsConstructor
@Slf4j
public class SpeechController {

    private final AiService aiService;

    @PostMapping(value = "/recognize", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<SpeechRecognizeResponse>> recognizeSpeech(
            @RequestParam("audio") MultipartFile audioFile) throws IOException {

        SpeechRecognizeResponse response = aiService.transcribeAudio(audioFile.getBytes());
        return ResponseEntity.ok(ApiResponse.success(response, "Audio transcribed"));
    }

    @PostMapping("/synthesize")
    public ResponseEntity<Resource> synthesizeSpeech(
            @RequestBody Map<String, String> body) {

        String text = body.get("text");
        byte[] audioBytes = aiService.synthesizeSpeech(text);
        ByteArrayResource resource = new ByteArrayResource(audioBytes);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/wav"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"speech.wav\"")
                .body(resource);
    }
}
