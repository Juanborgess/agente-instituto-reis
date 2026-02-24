import requests

# Agora vamos pedir para "conectar" na instância que já foi criada
url = "http://187.77.53.78:8080/instance/connect/InstitutoReis"

headers = {
    "apikey": "ReisFinanceiro2026",
    "Content-Type": "application/json"
}

print("⏳ Buscando o QR Code da instância InstitutoReis...")
response = requests.get(url, headers=headers)

if response.status_code == 200:
    data = response.json()
    
    # Extrai o QR Code
    qr_base64 = data.get("base64", "")
    
    if qr_base64:
        html_content = f'<html><body style="text-align:center; margin-top:50px;"><h2>Escaneie com o WhatsApp do Instituto Reis</h2><img src="{qr_base64}" style="width:300px; height:300px;"/></body></html>'
        
        with open("qrcode.html", "w", encoding="utf-8") as f:
            f.write(html_content)
        print("✅ SUCESSO! O arquivo 'qrcode.html' foi atualizado.")
        print("👉 Dê um clique duplo nele (ou abra no Chrome) para escanear.")
    else:
        print("⚠️ Instância encontrada, mas ela já está conectada ou o QR Code não foi gerado.")
        print("Resposta do servidor:", data)
else:
    print(f"❌ Erro ao buscar QR Code: {response.text}")