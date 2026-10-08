const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let limit = parseInt(query.limit, 10) || 10;
  
  if (limit > 100) {
    limit = 100;
  }
  
  const skip = (page - 1) * limit;

  const buildMeta = (totalRecords) => {
    return {
      currentPage: page,
      pageSize: limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  };

  return { skip, limit, buildMeta };
};

module.exports = getPagination;
