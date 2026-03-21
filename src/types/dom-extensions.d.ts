interface NetworkInformation {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  rtt?: number;
  downlink?: number;
  saveData?: boolean;
}

interface Navigator {
  deviceMemory?: number;
  connection?: NetworkInformation;
}
