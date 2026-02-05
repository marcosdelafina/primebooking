export const WHATSAPP_TEMPLATES = {
    APPOINTMENT_CANCELLED: {
        id: "HX99e36f9e31ac16c876262d05d1df2564",
        mapping: ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
    },
    APPOINTMENT_RESCHEDULED: {
        id: "HXf72ae70fea4da90b410174adde190ad3",
        mapping: ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
    },
    APPOINTMENT_CONFIRMED: {
        id: "HXc6b43780e31a1db9a2b107d27edf8cb5",
        mapping: ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
    },
    APPOINTMENT_REMINDER: {
        id: "HX366e1c3af76f0813c748734036cfccee",
        mapping: ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
    },
    APPOINTMENT_CREATED: {
        id: "HX601541311b8d3f35512b9b23efba3b3a",
        mapping: ["1", "2", "3", "4", "5", "6", "7", "8"] // Special mapping for this one per code
    },
};

/**
 * Global Variable Mapping Scheme:
 * {{1}} Client Name
 * {{2}} Business Name
 * {{3}} Business Address / Context (Location)
 * {{4}} Professional Name
 * {{5}} Service Name(s)
 * {{6}} Date (Formatted)
 * {{7}} Time (Formatted)
 * {{8}} Status Context (e.g. Pendente, Confirmado)
 * {{9}} Business WhatsApp / Contact
 */
export interface WhatsAppVariables extends Record<string, string> {
    "1": string;
    "2": string;
    "3": string;
    "4": string;
    "5": string;
    "6": string;
    "7": string;
    "8": string;
    "9": string;
}
