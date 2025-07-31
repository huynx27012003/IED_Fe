# --- Stage 1: Build ---
    FROM node:16-alpine AS builder
    WORKDIR /app
    
    # Cài dependencies
    COPY package*.json ./
    RUN npm ci --silent
    
    # Copy toàn bộ mã nguồn
    COPY . .
    
    # Build app Vue
    RUN npm run build
    
    # --- Stage 2: Serve bằng Nginx ---
    FROM nginx:stable-alpine
    
    # Xóa nội dung mặc định
    RUN rm -rf /usr/share/nginx/html/*
    
    # Copy sản phẩm build từ builder
    COPY --from=builder /app/dist /usr/share/nginx/html
    
    # Ghi đè file cấu hình nginx để hỗ trợ Vue Router (history mode)
    RUN echo 'server {\n\
      listen 80;\n\
      server_name localhost;\n\
      root /usr/share/nginx/html;\n\
      index index.html;\n\
    \n\
      location / {\n\
        try_files $uri $uri/ /index.html;\n\
      }\n\
    \n\
      error_page 404 /index.html;\n\
    \n\
      location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {\n\
        expires 1y;\n\
        log_not_found off;\n\
      }\n\
    }' > /etc/nginx/conf.d/default.conf
    
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]
    