function doGet(e) {
  const users = [
    ['20180746', '최성현'],
    ['20181494', '이아현'],
    ['20190629', '조경민'],
    ['20200138', '이상우'],
    ['20200660', '권희정'],
    ['20201155', '이호성'],
    ['20201538', '권지명'],
    ['20201539', '김경수'],
    ['20201540', '김영익'],
    ['20201541', '김영훈'],
    ['20201542', '김주영'],
    ['20201543', '남정청'],
    ['20201550', '윤진서'],
    ['20201553', '정민철'],
    ['20201558', '황상민'],
    ['20210381', '이다빈'],
    ['20211395', '안정현'],
    ['20211409', '민병선'],
    ['20211411', '손형준'],
    ['20211419', '이예성'],
    ['20221383', '박유미'],
    ['20221384', '서예원'],
    ['20221385', '여은채'],
    ['20221388', '이채원'],
    ['20221389', '최상은'],
    ['20221390', '최서영'],
    ['20221392', '최지윤'],
    ['20221398', '김륜구'],
    ['20221402', '김현목'],
    ['20221403', '박진'],
    ['20221407', '문군'],
    ['20221414', '정상준'],
    ['20221418', '조훈희'],
    ['20221574', '한석범'],
    ['20221923', '이중현'],
    ['20231868', '김지혜'],
    ['20241862', '이기정']
    ['123','123']
  ];

  const spreadsheetId = '16ZPTlk_6KAww7hYy2l-KVtsla4Nmi9Dyk9hN4UU4voA'; // 여기에 스프레드시트 ID 입력
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheets()[0];

  const userId = e.parameter && e.parameter.id;
  const password = e.parameter && e.parameter.password;

  let response;

  if (!userId || !password) {
    response = { status: "fail", message: "로그인 실패: ID 또는 비밀번호가 입력되지 않았습니다." };
    logAttempt(sheet, userId, "로그인 실패: ID 또는 비밀번호가 입력되지 않음", "fail");
  } else {
    const isAuthenticated = users.some(user => user[0] === userId && user[1] === password);
    const currentTime = new Date();

    if (isAuthenticated) {
      response = { status: "success", message: "로그인 성공!" };
      logAttempt(sheet, userId, "로그인 성공", "success");
    } else {
      response = { status: "fail", message: "로그인 실패: 학번 또는 이름이 일치하지 않습니다." };
      logAttempt(sheet, userId, "로그인 실패: 학번 또는 이름 불일치", "fail");
    }
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*'); // CORS 허용
}

// 로그 기록 함수
function logAttempt(sheet, userId, message, comment) {
  const currentTime = new Date();

  // 현재 마지막 행에 새로운 순서 번호 설정
  const logOrder = sheet.getLastRow() + 1;

  // 새 행에 데이터를 추가 (순서, 날짜, 시간, 사용자 ID, 로그인 성공/실패 여부 순서, 코멘트)
  sheet.appendRow([
    logOrder,                        // A열: 로그 순서 (순차적으로 증가)
    currentTime.toLocaleDateString(), // B열: 날짜
    currentTime.toLocaleTimeString(), // C열: 시간
    userId || "알 수 없음",           // D열: 사용자 ID
    message,                          // E열: 로그인 성공/실패 여부
    comment                           // F열: 로그인 성공/실패 코멘트 ("success" 또는 "fail")
  ]);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { userId, message, comment, score, timeSurvived } = data; // 추가 필드 포함

    const spreadsheetId = '16ZPTlk_6KAww7hYy2l-KVtsla4Nmi9Dyk9hN4UU4voA'; // 스프레드시트 ID
    const sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();

    // 로그 기록
    const logOrder = sheet.getLastRow() + 1;
    sheet.appendRow([
      logOrder,                            // A열: 로그 순서
      new Date().toLocaleDateString(),     // B열: 날짜
      new Date().toLocaleTimeString(),     // C열: 시간
      userId || "Unknown",                 // D열: 사용자 ID
      message,                             // E열: 메시지 (게임 시작, 게임 종료 등)
      comment,                             // F열: 코멘트 ("start", "die" 등)
      score || "N/A",                      // G열: 점수 (게임 오버 시 기록)
      timeSurvived || "N/A"                // H열: 생존 시간 (게임 오버 시 기록)
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*'); // CORS 허용
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*'); // CORS 허용
  }
}
