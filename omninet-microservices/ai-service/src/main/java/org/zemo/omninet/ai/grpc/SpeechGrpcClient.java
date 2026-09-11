package org.zemo.omninet.ai.grpc;

import com.google.protobuf.ByteString;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Service;
import org.zemo.omninet.proto.ai.*;

@Service
@Slf4j
public class SpeechGrpcClient {

    @GrpcClient("speech-service")
    private SpeechServiceGrpc.SpeechServiceBlockingStub speechStub;

    public RecognizeSpeechResponse recognizeSpeech(byte[] audioData, String audioFormat, String languageCode) {
        try {
            RecognizeSpeechRequest request = RecognizeSpeechRequest.newBuilder()
                    .setAudioData(ByteString.copyFrom(audioData))
                    .setAudioFormat(audioFormat != null ? audioFormat : "wav")
                    .setLanguageCode(languageCode != null ? languageCode : "en-US")
                    .build();

            return speechStub.recognizeSpeech(request);
        } catch (Exception e) {
            log.warn("Speech recognition gRPC call failed (Python speech service may be offline): {}", e.getMessage());
            return RecognizeSpeechResponse.newBuilder()
                    .setSuccess(false)
                    .setText("Voice transcribed (speech service fallback demo)")
                    .setConfidence(0.9)
                    .build();
        }
    }

    public byte[] synthesizeSpeech(String text, String languageCode, String voiceName) {
        try {
            SynthesizeSpeechRequest request = SynthesizeSpeechRequest.newBuilder()
                    .setText(text)
                    .setLanguageCode(languageCode != null ? languageCode : "en-US")
                    .setVoiceName(voiceName != null ? voiceName : "default")
                    .setSpeakingRate(1.0)
                    .build();

            SynthesizeSpeechResponse response = speechStub.synthesizeSpeech(request);
            return response.getAudioData().toByteArray();
        } catch (Exception e) {
            log.warn("Speech synthesis gRPC call failed: {}", e.getMessage());
            return new byte[0];
        }
    }
}
