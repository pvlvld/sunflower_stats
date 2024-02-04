function isDbResNotEmpty(res: any) {
  return Array.isArray(res) && res.length > 0;
}

export default isDbResNotEmpty;
