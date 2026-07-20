/**
 * Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu và viết thường
 * Phục vụ cho tìm kiếm không dấu
 * @param {string} str Chuỗi tiếng Việt cần chuyển đổi
 * @returns {string} Chuỗi không dấu, viết thường, đã loại bỏ khoảng trắng thừa
 */
export function normalizeText(str) {
  if (!str) return '';
  
  let result = str.toLowerCase();
  
  // Thay thế các ký tự có dấu thành không dấu
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  result = result.replace(/đ/g, 'd');
  
  // Loại bỏ các ký tự đặc biệt khác nếu cần
  // Giữ lại chữ cái, số và khoảng trắng
  result = result.replace(/[^a-z0-9\s]/g, '');
  
  // Thu gọn nhiều khoảng trắng thành 1 khoảng trắng
  result = result.replace(/\s+/g, ' ');
  
  return result.trim();
}
