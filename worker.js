// worker.js - Главный файл Worker
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/').filter(p => p)
  
  // Корневая страница
  if (pathParts.length === 0) {
    return homePage()
  }
  
  // Страница импорта
  if (pathParts[0] === 'import' && pathParts[1]) {
    const configB64 = pathParts[1]
    return importPage(configB64)
  }
  
  // 404
  return notFoundPage()
}

// Главная страница
function homePage() {
  const html = `
  <!DOCTYPE html>
  <html lang="ru">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Happ Import Service</title>
      <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
          }
          .card {
              background: white;
              border-radius: 20px;
              padding: 40px;
              max-width: 600px;
              width: 90%;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
          }
          h1 {
              color: #333;
              margin-bottom: 20px;
              font-size: 2.5em;
          }
          .logo {
              font-size: 4em;
              margin-bottom: 20px;
          }
          .features {
              text-align: left;
              margin: 30px 0;
              background: #f8f9fa;
              padding: 20px;
              border-radius: 10px;
          }
          .features li {
              margin: 10px 0;
              padding-left: 20px;
              position: relative;
          }
          .features li:before {
              content: "✓";
              color: #28a745;
              position: absolute;
              left: 0;
          }
          .url-example {
              background: #f1f3f4;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              font-family: monospace;
              word-break: break-all;
          }
          .status {
              color: #28a745;
              font-weight: bold;
              margin-top: 20px;
          }
      </style>
  </head>
  <body>
      <div class="card">
          <div class="logo">🚀</div>
          <h1>Happ Import Service</h1>
          <p>Сервис для автоматического импорта VPN конфигураций в приложение Happ</p>
          
          <div class="features">
              <h3>Функции:</h3>
              <ul>
                  <li>Автоматическое открытие Happ на Android/iOS</li>
                  <li>Резервный вариант для ручного импорта</li>
                  <li>Копирование ключа в один клик</li>
                  <li>Поддержка QR-кодов</li>
              </ul>
          </div>
          
          <div class="url-example">
              Пример использования:<br>
              https://happ-import.YOUR_NAME.workers.dev/import/BASE64_CONFIG
          </div>
          
          <div class="status">✅ Сервис работает</div>
          <p style="margin-top: 20px; color: #666;">Powered by Cloudflare Workers</p>
      </div>
  </body>
  </html>
  `
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}

// Страница импорта
function importPage(configB64) {
  try {
    // Декодируем конфиг для отображения
    const decoded = atob(configB64)
    const config = JSON.parse(decoded)
    const vlessKey = config.configs?.[0]?.config || 'Ошибка декодирования'
    
    const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Импорт в Happ VPN</title>
        <script>
            let happOpened = false
            
            function openHapp() {
                // Пытаемся открыть Happ
                window.location.href = 'happ://import/config?config=${configB64}'
                happOpened = true
                
                // Если через 1 секунду не открылось - показываем fallback
                setTimeout(() => {
                    if (!happOpened) {
                        document.getElementById('fallback').style.display = 'block'
                        document.getElementById('loading').style.display = 'none'
                    }
                }, 1000)
                
                // Блокируем повторные попытки на 5 секунд
                setTimeout(() => { happOpened = false }, 5000)
            }
            
            function copyToClipboard() {
                const text = \`${vlessKey.replace(/`/g, '\\`')}\`
                navigator.clipboard.writeText(text).then(() => {
                    alert('✅ Ключ скопирован в буфер обмена!')
                }).catch(() => {
                    // Fallback для старых браузеров
                    const textarea = document.createElement('textarea')
                    textarea.value = text
                    document.body.appendChild(textarea)
                    textarea.select()
                    document.execCommand('copy')
                    document.body.removeChild(textarea)
                    alert('✅ Ключ скопирован!')
                })
            }
            
            function openAppStore(platform) {
                if (platform === 'ios') {
                    window.location.href = 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215'
                } else {
                    window.location.href = 'https://play.google.com/store/apps/details?id=com.happproxy&hl=ru'
                }
            }
            
            // Пытаемся открыть Happ при загрузке
            window.onload = openHapp
            
            // Если пользователь вернулся на страницу - считаем что Happ не открылся
            window.onpageshow = function(event) {
                if (event.persisted) {
                    document.getElementById('fallback').style.display = 'block'
                    document.getElementById('loading').style.display = 'none'
                }
            }
        </script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .icon {
                font-size: 4em;
                margin-bottom: 10px;
            }
            h1 {
                color: #333;
                margin-bottom: 10px;
            }
            .status {
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                text-align: center;
            }
            .loading {
                background: #e3f2fd;
                border-left: 5px solid #2196f3;
            }
            .success {
                background: #e8f5e9;
                border-left: 5px solid #4caf50;
            }
            .fallback {
                background: #fff3e0;
                border-left: 5px solid #ff9800;
            }
            .key-container {
                background: #f5f5f5;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                word-break: break-all;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                max-height: 200px;
                overflow-y: auto;
            }
            .buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin: 20px 0;
            }
            .btn {
                flex: 1;
                min-width: 200px;
                padding: 15px 20px;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                text-decoration: none;
                display: inline-block;
                text-align: center;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            .btn-primary {
                background: #2196f3;
                color: white;
            }
            .btn-secondary {
                background: #4caf50;
                color: white;
            }
            .btn-warning {
                background: #ff9800;
                color: white;
            }
            .btn-info {
                background: #9c27b0;
                color: white;
            }
            .instructions {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
            }
            ol { padding-left: 20px; }
            li { margin: 10px 0; }
            .footer {
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">🔑</div>
                <h1>Импорт VPN конфигурации</h1>
                <p>Автоматическое добавление в приложение Happ</p>
            </div>
            
            <div id="loading" class="status loading">
                <h3>⏳ Открываем Happ...</h3>
                <p>Пожалуйста, подождите</p>
            </div>
            
            <div id="fallback" class="status fallback" style="display: none;">
                <h3>📱 Ручной импорт</h3>
                <p>Если Happ не открылся автоматически, выполните следующие шаги:</p>
            </div>
            
            <div class="instructions">
                <h4>Пошаговая инструкция:</h4>
                <ol>
                    <li>Нажмите кнопку "📋 Скопировать ключ" ниже</li>
                    <li>Откройте приложение Happ на вашем устройстве</li>
                    <li>Нажмите "+" в правом нижнем углу</li>
                    <li>Выберите "Импорт из буфера обмена"</li>
                    <li>Нажмите "Подключить"</li>
                </ol>
            </div>
            
            <div class="key-container">
                <strong>Ваш VPN ключ:</strong><br>
                <div style="margin-top: 10px;">${vlessKey}</div>
            </div>
            
            <div class="buttons">
                <button onclick="copyToClipboard()" class="btn btn-primary">
                    📋 Скопировать ключ
                </button>
                <button onclick="openHapp()" class="btn btn-secondary">
                    🔄 Повторить авто-импорт
                </button>
                <button onclick="openAppStore('android')" class="btn btn-warning">
                    🤖 Скачать для Android
                </button>
                <button onclick="openAppStore('ios')" class="btn btn-info">
                     Скачать для iOS
                </button>
            </div>
            
            <div class="footer">
                <p>Если возникли проблемы, переустановите приложение Happ</p>
                <p style="margin-top: 10px;">Сервис предоставлен Cloudflare Workers</p>
            </div>
        </div>
    </body>
    </html>
    `
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })
    
  } catch (error) {
    return new Response(`Ошибка: ${error.message}`, { status: 400 })
  }
}

// Страница 404
function notFoundPage() {
  return new Response('404 - Страница не найдена', { 
    status: 404,
    headers: { 'Content-Type': 'text/html' }
  })
}
