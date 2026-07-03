# =====================================================================
# JALYUZI ERP — Backend Dockerfile
# Multi-stage build:
#   1) Maven build (Java 17) + Spring Boot layered extract
#   2) JRE-only runtime (alpine)
#
# Layered JAR: dependencies (faqat pom.xml o'zgarganda) va application
# (~1-2MB, har push'da) ALOHIDA Docker layerlarda. Shu tufayli oddiy
# deploy'da server registry'dan faqat kichik application layerni tortadi —
# sekin server<->ghcr.io tarmog'ida ham deploy ishonchli o'tadi.
# =====================================================================

# ========== BUILD STAGE ==========
FROM maven:3.9-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Avval faqat dependency fayllarni kopiyalaymiz (cache uchun)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Keyin source kodni kopiyalaymiz va build qilamiz
COPY src ./src
RUN mvn clean package -DskipTests -B

# Layered extract: JAR to'rt qatlamga ajratiladi (dependencies,
# spring-boot-loader, snapshot-dependencies, application)
RUN java -Djarmode=tools -jar target/jalyuzi_epr_api.jar extract --layers --launcher --destination target/extracted

# ========== RUN STAGE ==========
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Timezone sozlash
RUN apk add --no-cache tzdata
ENV TZ=Asia/Tashkent

# Layer tartibi muhim: eng kam o'zgaradigani birinchi — o'zgarmagan
# layerlarni server "Already exists" deb o'tkazib yuboradi.
COPY --from=build /app/target/extracted/dependencies/ ./
COPY --from=build /app/target/extracted/spring-boot-loader/ ./
COPY --from=build /app/target/extracted/snapshot-dependencies/ ./
COPY --from=build /app/target/extracted/application/ ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8170/api/actuator/health || exit 1

EXPOSE 8170

# Layered rejimda JAR emas, JarLauncher ishga tushiriladi
ENTRYPOINT ["java", \
    "-Dspring.profiles.active=prod", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Xms256m", "-Xmx512m", \
    "org.springframework.boot.loader.launch.JarLauncher"]
