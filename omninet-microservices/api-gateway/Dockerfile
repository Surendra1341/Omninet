FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S omninet && adduser -S omninet -G omninet

COPY target/api-gateway-*.jar app.jar

RUN chown -R omninet:omninet /app
USER omninet

EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
