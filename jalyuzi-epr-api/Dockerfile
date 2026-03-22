# ========== BUILD STAGE ==========
FROM maven:3.9-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Avval faqat dependency fayllarni kopiyalaymiz (cache uchun)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Keyin source kodni kopiyalaymiz va build qilamiz
COPY src ./src
RUN mvn clean package -DskipTests -B

# ========== RUN STAGE ==========
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Timezone sozlash
RUN apk add --no-cache tzdata
ENV TZ=Asia/Tashkent

# JAR faylni kopiyalaymiz
COPY --from=build /app/target/jalyuzi_epr_api.jar app.jar

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8170/api/actuator/health || exit 1

EXPOSE 8170

ENTRYPOINT ["java", "-jar", \
    "-Dspring.profiles.active=prod", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Xms256m", "-Xmx512m", \
    "app.jar"]
