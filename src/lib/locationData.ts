/**
 * Generate cache-busting version string
 * Updates every hour to balance freshness with caching benefit
 * Use this as a React key prop to force re-render when image changes
 */
export function getImageCacheKey(): string {
  const now = new Date();
  // Create version based on date and hour (changes every hour)
  return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}`;
}

/**
 * Encode image path to handle special characters like & in folder names
 */
export function encodeImagePath(path: string): string {
  // Split by '/', encode each segment, then rejoin
  return path.split('/').map(segment => encodeURIComponent(segment)).join('/');
}

export interface LocationData {
  locationName: string;
  actionPlanUrl: string;
  summaryPlanUrl: string;
  qrActionPath: string;
  qrSummaryPath: string;
  sopImagePath: string;
}

export const LOCATION_DATA: Record<string, LocationData> = {
  "AQL F1&2": {
    locationName: "AQL F1&2",
    actionPlanUrl: "https://forms.gle/P8CVuKFmf7CqdDb88",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/15QwQff0-DAZ8La4Sr02ybtyzmvlSt2hCWsIMVvErWgw/edit?usp=sharing",
    qrActionPath: "/assets/location/AQL F1&2/QR Action.png",
    qrSummaryPath: "/assets/location/AQL F1&2/QR Summary.png",
    sopImagePath: "/assets/location/AQL F1&2/SOP.jpg",
  },
  "IMWH B1": {
    locationName: "IMWH B1",
    actionPlanUrl: "https://forms.gle/4kR7iL6WrMD3KT8A6",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1dqiKS-yKjFTMbkQdQqL6oZM99bugibYgW4zJDpXZdWs/edit?usp=sharing",
    qrActionPath: "/assets/location/IMWH B1/QR Action.png",
    qrSummaryPath: "/assets/location/IMWH B1/QR Summary.png",
    sopImagePath: "/assets/location/IMWH B1/SOP.jpg",
  },
  "IMWH B2": {
    locationName: "IMWH B2",
    actionPlanUrl: "https://forms.gle/nqqRHskFPeYnuhweA",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1g1gvSaTPqp2vK_WH8ZKAvhcVCaO_G0l0FlNJG0SMi-4/edit?usp=sharing",
    qrActionPath: "/assets/location/IMWH B2/QR Action.png",
    qrSummaryPath: "/assets/location/IMWH B2/QR Summary.png",
    sopImagePath: "/assets/location/IMWH B2/SOP.jpg",
  },
  "FGWH F5": {
    locationName: "FGWH F5",
    actionPlanUrl: "https://forms.gle/yJFbujpSotpm5C9y7",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/12rjnowhNhPbakjbdfyEZDctvd0ublDFoXrAJ55nZNSM/edit?usp=sharing",
    qrActionPath: "/assets/location/FGWH F5/QR Action.png",
    qrSummaryPath: "/assets/location/FGWH F5/QR Summary.png",
    sopImagePath: "/assets/location/FGWH F5/SOP.jpg",
  },
  "FGWH F6": {
    locationName: "FGWH F6",
    actionPlanUrl: "https://forms.gle/DCLJLsy1SvqT9Fnb8",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1-wL-Y1YalrFpr6lWdJGWUjfYJqx-BWFtY1WkcqKZ2JQ/edit?usp=sharing",
    qrActionPath: "/assets/location/FGWH F6/QR Action.png",
    qrSummaryPath: "/assets/location/FGWH F6/QR Summary.png",
    sopImagePath: "/assets/location/FGWH F6/SOP.jpg",
  },
  "FGWH F1&2": {
    locationName: "FGWH F1&2",
    actionPlanUrl: "https://forms.gle/AQhDVP1CfNTpPnwx8",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1tI4L7yzbWwobGtXA1g89NmURRUQr9lTdN7hHWVZ0ctc/edit?usp=sharing",
    qrActionPath: "/assets/location/FGWH F1&2/QR Action.png",
    qrSummaryPath: "/assets/location/FGWH F1&2/QR Summary.png",
    sopImagePath: "/assets/location/FGWH F1&2/SOP.jpg",
  },
  "FGWH F3&4": {
    locationName: "FGWH F3&4",
    actionPlanUrl: "https://forms.gle/uzhBvQiN5uWmSfSq6",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1Ul4w0pqw3qNikhQuTebc87VXW-fkEZuxCJieKIPaRMQ/edit?usp=sharing",
    qrActionPath: "/assets/location/FGWH F3&4/QR Action.png",
    qrSummaryPath: "/assets/location/FGWH F3&4/QR Summary.png",
    sopImagePath: "/assets/location/FGWH F3&4/SOP.jpg",
  },
  "BC GRADE": {
    locationName: "BC GRADE",
    actionPlanUrl: "https://forms.gle/9N3ntTPs82kvFqubA",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1CtiZ9skEZH7fVxPIG1CznpRSz7nLNBrSH3cqIIzEAWQ/edit?usp=sharing",
    qrActionPath: "/assets/location/BC GRADE/QR Action.png",
    qrSummaryPath: "/assets/location/BC GRADE/QR Summary.png",
    sopImagePath: "/assets/location/BC GRADE/SOP.jpg",
  },
  "FACTORY 1": {
    locationName: "FACTORY 1",
    actionPlanUrl: "https://forms.gle/ZNhfRxhNGnF87WEF7",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1Lb25omuscxws5BIB56U0iX_H-AiOepSLcE0Uo9VyUTE/edit?usp=sharing",
    qrActionPath: "/assets/location/FACTORY 1/QR Action.png",
    qrSummaryPath: "/assets/location/FACTORY 1/QR Summary.png",
    sopImagePath: "/assets/location/FACTORY 1/SOP.jpg",
  },
  "FACTORY 2": {
    locationName: "FACTORY 2",
    actionPlanUrl: "https://forms.gle/hWsAHxwRUAqTvWaN7",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/12DcHop5xcDDiMTB9JsCRCz5bI1HSgKGXHgSO2dlwRu0/edit?usp=sharing",
    qrActionPath: "/assets/location/FACTORY 2/QR Action.png",
    qrSummaryPath: "/assets/location/FACTORY 2/QR Summary.png",
    sopImagePath: "/assets/location/FACTORY 2/SOP.jpg",
  },
  "FACTORY 3": {
    locationName: "FACTORY 3",
    actionPlanUrl: "https://forms.gle/zssKieVMJEVviKj76",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1NZeT2vd-F8FY3qaupYrXztG4c-e7G9ck24KvL_ooTMg/edit?usp=sharing",
    qrActionPath: "/assets/location/FACTORY 3/QR Action.png",
    qrSummaryPath: "/assets/location/FACTORY 3/QR Summary.png",
    sopImagePath: "/assets/location/FACTORY 3/SOP.jpg",
  },
  "FACTORY 4": {
    locationName: "FACTORY 4",
    actionPlanUrl: "https://forms.gle/kPXfiRdaDVShiMYv6",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1nz-SsiUgBW9h3egrrTC-lunjdiKsQQAE0TRX5age7uQ/edit?usp=sharing",
    qrActionPath: "/assets/location/FACTORY 4/QR Action.png",
    qrSummaryPath: "/assets/location/FACTORY 4/QR Summary.png",
    sopImagePath: "/assets/location/FACTORY 4/SOP.jpg",
  },
  "PAXAR": {
    locationName: "PAXAR",
    actionPlanUrl: "https://forms.gle/8Z5uXcGAsi673cqp7",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1Z3KimCtKalh9hVyrCu1spQCXc7pVO4jWZhIArqUfhCg/edit?usp=sharing",
    qrActionPath: "/assets/location/PAXAR/QR Action.png",
    qrSummaryPath: "/assets/location/PAXAR/QR Summary.png",
    sopImagePath: "/assets/location/PAXAR/SOP.jpg",
  },
  "FACTORY 5": {
    locationName: "FACTORY 5",
    actionPlanUrl: "https://forms.gle/4TBB4Gz1ibBPjend7",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/16Bdr09Kt5t6fCf960KANX3nQSD1O0GvJbiXMtTVCBEY/edit?usp=sharing",
    qrActionPath: "/assets/location/FACTORY 5/QR Action.png",
    qrSummaryPath: "/assets/location/FACTORY 5/QR Summary.png",
    sopImagePath: "/assets/location/FACTORY 5/SOP.jpg",
  },
  "BOTTOM 1": {
    locationName: "BOTTOM 1",
    actionPlanUrl: "https://forms.gle/V2Jd2yUmjKNtgDex7",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1t31heJ89e7_sm76bESD_5L28-8Htxq7M5GnuWiFkJYU/edit?usp=sharing",
    qrActionPath: "/assets/location/BOTTOM 1/QR Action.png",
    qrSummaryPath: "/assets/location/BOTTOM 1/QR Summary.png",
    sopImagePath: "/assets/location/BOTTOM 1/SOP.jpg",
  },
  "BOTTOM 2": {
    locationName: "BOTTOM 2",
    actionPlanUrl: "https://forms.gle/R7TSGrkPCfa778fD7",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1lj9JFUdvDlrfq-WXRVRQQ76PHxUAMZaqHrOF3jMsSdA/edit?usp=sharing",
    qrActionPath: "/assets/location/BOTTOM 2/QR Action.png",
    qrSummaryPath: "/assets/location/BOTTOM 2/QR Summary.png",
    sopImagePath: "/assets/location/BOTTOM 2/SOP.jpg",
  },
  "INHOUSE": {
    locationName: "INHOUSE",
    actionPlanUrl: "https://forms.gle/uzndR9J5bYBjQYxJ9",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1D4JiA33t77lwM9YcEvLgjkMldCgFlfLHfBMOFAKi-X4/edit?usp=sharing",
    qrActionPath: "/assets/location/INHOUSE/QR Action.png",
    qrSummaryPath: "/assets/location/INHOUSE/QR Summary.png",
    sopImagePath: "/assets/location/INHOUSE/SOP.jpg",
  },
  "AQL F3&4": {
    locationName: "AQL F3&4",
    actionPlanUrl: "https://forms.gle/nXQeqWrmrgFE1TR98",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/16mt6s4Csl5s9U309LnNoBPvJHs8-k3vFAyW2xpBdJkM/edit?usp=sharing",
    qrActionPath: "/assets/location/AQL F3&4/QR Action.png",
    qrSummaryPath: "/assets/location/AQL F3&4/QR Summary.png",
    sopImagePath: "/assets/location/AQL F3&4/SOP.jpg",
  },
  "AQL F5": {
    locationName: "AQL F5",
    actionPlanUrl: "https://forms.gle/rnq44LCd4Ekac7VU7",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1omzasfyVH61nkjkaryKhkF3XsBziSWb0SpBrqcPzGGU/edit?usp=sharing",
    qrActionPath: "/assets/location/AQL F5/QR Action.png",
    qrSummaryPath: "/assets/location/AQL F5/QR Summary.png",
    sopImagePath: "/assets/location/AQL F5/SOP.jpg",
  },
  "AQL F6": {
    locationName: "AQL F6",
    actionPlanUrl: "https://forms.gle/WhWpGEmAbENbEjco9",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1qUUAzJfOUtjnP49boUjp8Jr6FW5olm1_FYHa4fZ2e80/edit?usp=sharing",
    qrActionPath: "/assets/location/AQL F6/QR Action.png",
    qrSummaryPath: "/assets/location/AQL F6/QR Summary.png",
    sopImagePath: "/assets/location/AQL F6/SOP.jpg",
  },
  "REPACKING": {
    locationName: "REPACKING",
    actionPlanUrl: "https://forms.gle/JyJMZ4mU3MDciAvq6",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1Ee0Y2LRZT7qn1ZQcG4186wCWqeS0mOyF93ZnqL8giGw/edit?usp=sharing",
    qrActionPath: "/assets/location/REPACKING/QR Action.png",
    qrSummaryPath: "/assets/location/REPACKING/QR Summary.png",
    sopImagePath: "/assets/location/REPACKING/SOP.jpg",
  },
  "WH CHEMICAL": {
    locationName: "WH CHEMICAL",
    actionPlanUrl: "https://forms.gle/EM4nMVkDxxLaFguZ6",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1apNXKeI1E6v4_sJLn8dkMh1Q1UO4XuMuNCr-a8kXLDY/edit?usp=sharing",
    qrActionPath: "/assets/location/WH CHEMICAL/QR Action.png",
    qrSummaryPath: "/assets/location/WH CHEMICAL/QR Summary.png",
    sopImagePath: "/assets/location/WH CHEMICAL/SOP.jpg",
  },
  "WH RUBBER": {
    locationName: "WH RUBBER",
    actionPlanUrl: "https://forms.gle/fK3UMQe56RKLtEUY7",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1Uqjcw57MUXfbjafQl-T7g25brh8SlPgIz2sAuRmHNgc/edit?usp=sharing",
    qrActionPath: "/assets/location/WH RUBBER/QR Action.png",
    qrSummaryPath: "/assets/location/WH RUBBER/QR Summary.png",
    sopImagePath: "/assets/location/WH RUBBER/SOP.jpg",
  },
  "WH PACKAGING": {
    locationName: "WH PACKAGING",
    actionPlanUrl: "https://forms.gle/R3cMKuU8ZgdoER3Q6",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1daMT_gUX6xxE3gRDrugW_aqInn328e0I7iM2nHyl3xs/edit?usp=sharing",
    qrActionPath: "/assets/location/WH PACKAGING/QR Action.png",
    qrSummaryPath: "/assets/location/WH PACKAGING/QR Summary.png",
    sopImagePath: "/assets/location/WH PACKAGING/SOP.jpg",
  },
  "LAMINATING B1": {
    locationName: "LAMINATING B1",
    actionPlanUrl: "https://forms.gle/3g9dbqYTXiG7P5xP8",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1C2-hMV0nPp3ynHx9nwNFKchsFyBBECCjZuK2uUWnXgI/edit?usp=sharing",
    qrActionPath: "/assets/location/LAMINATING B1/QR Action.png",
    qrSummaryPath: "/assets/location/LAMINATING B1/QR Summary.png",
    sopImagePath: "/assets/location/LAMINATING B1/SOP.jpg",
  },
  "LAMINATING B2": {
    locationName: "LAMINATING B2",
    actionPlanUrl: "https://forms.gle/LYaEPx8NEJJnJ5TSA",
    summaryPlanUrl: "https://docs.google.com/spreadsheets/d/1VL4bcj0r8Er1DvzAMCqxQ-CqlZ41puyD54H_-QLop8Q/edit?usp=sharing",
    qrActionPath: "/assets/location/LAMINATING B2/QR Action.png",
    qrSummaryPath: "/assets/location/LAMINATING B2/QR Summary.png",
    sopImagePath: "/assets/location/LAMINATING B2/SOP.jpg",
  },
};

export function getLocationData(locationName: string): LocationData | null {
  return LOCATION_DATA[locationName] || null;
}