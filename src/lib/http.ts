export const isSuccessful = (response: XMLHttpRequest, label: string) => {
  if (response.status >= 200 && response.status < 300) {
    return true;
  }
  console.error(`${label} error`, response.status, response.responseText);
  return false;
};

export const safeRequest = async (
  request: () => Promise<XMLHttpRequest>,
  label: string,
): Promise<XMLHttpRequest | null> => {
  try {
    return await request();
  } catch (error) {
    console.error(`${label} request failed`, error);
    return null;
  }
};
