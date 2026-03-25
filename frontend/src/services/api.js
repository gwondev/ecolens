// src/services/api.js 예시 (파일 내용에 맞춰 수정하세요)

// 1. 백엔드 서버의 전체 주소를 정확히 적어줍니다. (https:// 필수!)
const BASE_URL = "https://greeneye.gwon.run/api"; 

export async function apiFetch(path, options = {}) {
  // 2. 주소 결합 시 '/'가 중복되거나 빠지지 않도록 처리합니다.
  const url = `${BASE_URL}${path}`; 
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // 3. 만약 서버 응답이 OK가 아니면 에러를 던집니다. (디버깅용)
  if (!response.ok) {
    const errorData = await response.text(); // HTML인지 확인하기 위해 text로 받음 ss
    console.error("서버 에러 응답:", errorData);
    throw new Error(`서버 에러: ${response.status}`);
  }

  return response.json();
}