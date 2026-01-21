import useSWR from 'swr';
import fetcher from './fetcher';
export default function useHomepage({ param, storeID }) {
  // Only include storeID in URL if it's provided and not undefined
  const storeIDParam = storeID ? `?storeID=${storeID}` : '';
  
  if (param) {
    const { data, error } = useSWR(`/api/admin/dashboard/${param}${storeIDParam}`, fetcher);
    return {
      data,
      isLoading: !error && !data,
      isError: error
    };
  } else {
    const { data, error } = useSWR(`/api/admin/dashboard${storeIDParam}`, fetcher);
    return {
      data,
      isLoading: !error && !data,
      isError: error
    };
  }
}
