interface BaseUserOrganizationLink {
  is_external: boolean;
  verification_type:
    | "verified_email_domain"
    | "official_contact_email"
    | "official_contact_domain"
    | "code_sent_to_official_contact_email"
    | "in_liste_dirigeants_rna"
    | null;
  authentication_by_peers_type:
    | "all_members_notified"
    | "sponsored_by_member"
    | "is_the_only_active_member"
    | "deactivated_by_whitelist"
    | null;
  has_been_greeted: boolean;
  sponsor_id: number | null;
  needs_official_contact_email_verification: boolean;
  official_contact_email_verification_token: string | null;
  official_contact_email_verification_sent_at: Date | null;
}

interface UserOrganizationLink extends BaseUserOrganizationLink {
  user_id: number;
  organization_id: number;
  created_at: Date;
  updated_at: Date;
}
