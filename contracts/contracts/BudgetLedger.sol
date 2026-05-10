// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BudgetLedger
 * @notice Registre budgétaire immuable pour les communes ivoiriennes — KOMOE (MIABE 2026)
 * @dev Enregistre les dépenses et recettes communales sur Polygon via des events indexés.
 *      Utilise AccessControl d'OpenZeppelin pour sécuriser les rôles Agent/Maire.
 *      Le state on-chain est minimal (contrôle d'accès uniquement).
 *      Les données financières vivent dans les events (lecture via Ethers.js/Web3.py).
 *
 * Rôles :
 *   DEFAULT_ADMIN_ROLE → déployeur (DGDDL) : peut attribuer/révoquer tous les rôles
 *   AGENT_ROLE         → Agent Financier : peut soumettre des dépenses (brouillon)
 *   MAIRE_ROLE         → Maire/Conseil Municipal : peut valider définitivement sur blockchain
 */
contract BudgetLedger is AccessControl, Pausable {
    // ─── Rôles ────────────────────────────────────────────────────────────────
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant MAIRE_ROLE = keccak256("MAIRE_ROLE");

    // ─── Scoping par commune ──────────────────────────────────────────────────
    // wallet => communeId
    mapping(address => string) public walletCommune;

    // ─── Compteur global de transactions ──────────────────────────────────────
    uint256 private _transactionCount;

    // ─── Events indexés (le registre immuable public) ─────────────────────────

    /**
     * @notice Émis quand un Agent Financier soumet une dépense (brouillon côté blockchain)
     * @param depenseId  Identifiant unique Django (UUID stringifié)
     * @param communeId  Identifiant de la commune
     * @param montant    Montant en FCFA (entier, pas de virgule)
     * @param categorie  Catégorie budgétaire (ex: "Infrastructure", "Santé")
     * @param ipfsHash   Hash IPFS du justificatif PDF (via Pinata)
     * @param soumisePar Adresse wallet de l'Agent Financier
     * @param timestamp  Horodatage UNIX de la soumission
     */
    event DepenseSoumise(
        string indexed depenseId,
        string indexed communeId,
        uint256 montant,
        string categorie,
        string ipfsHash,
        address indexed soumisePar,
        uint256 timestamp
    );

    /**
     * @notice Émis quand un Maire valide définitivement une dépense — preuve publique immuable
     * @param depenseId  Identifiant unique Django (UUID stringifié)
     * @param communeId  Identifiant de la commune
     * @param montant    Montant en FCFA
     * @param categorie  Catégorie budgétaire
     * @param ipfsHash   Hash IPFS du justificatif PDF
     * @param validePar  Adresse wallet du Maire signataire
     * @param timestamp  Horodatage UNIX de la validation
     */
    event DepenseValidee(
        string indexed depenseId,
        string indexed communeId,
        uint256 montant,
        string categorie,
        string ipfsHash,
        address indexed validePar,
        uint256 timestamp
    );

    event RecetteSoumise(
        string indexed recetteId,
        string indexed communeId,
        uint256 montant,
        string source,
        string ipfsHash,
        address indexed parAgent,
        uint256 timestamp
    );

    /**
     * @notice Émis quand une recette est enregistrée par le Maire
     * @param recetteId  Identifiant unique Django
     * @param communeId  Identifiant de la commune
     * @param montant    Montant en FCFA
     * @param source     Source de la recette (ex: "Taxes locales", "Subvention État")
     * @param ipfsHash   Hash IPFS du document justificatif
     * @param enregistreePar Adresse wallet du Maire
     * @param timestamp  Horodatage UNIX
     */
    event RecetteEnregistree(
        string indexed recetteId,
        string indexed communeId,
        uint256 montant,
        string source,
        string ipfsHash,
        address indexed enregistreePar,
        uint256 timestamp
    );

    /**
     * @notice Émis quand la DGDDL alloue une dotation budgétaire à une commune
     * @param communeId ID de la commune (string Django)
     * @param montant Montant alloué en FCFA
     * @param timestamp Horodatage UNIX
     */
    event DotationEnregistree(
        string indexed communeId,
        uint256 montant,
        uint256 timestamp
    );


    /**
     * @notice Émis quand un nouveau rôle Agent est attribué à une adresse
     */
    event AgentRoleAttribue(address indexed wallet, address indexed parAdmin, uint256 timestamp);

    /**
     * @notice Émis quand un nouveau rôle Maire est attribué à une adresse
     */
    event MaireRoleAttribue(address indexed wallet, address indexed parAdmin, uint256 timestamp);

    // ─── Constructeur ──────────────────────────────────────────────────────────

    /**
     * @param adminDGDDL Adresse du déployeur initial (DGDDL — super-admin)
     */
    constructor(address adminDGDDL) {
        require(adminDGDDL != address(0), "BudgetLedger: adresse admin invalide");
        _grantRole(DEFAULT_ADMIN_ROLE, adminDGDDL);
    }

    // ─── Fonctions principales ─────────────────────────────────────────────────

    /**
     * @notice Soumet une dépense en attente de validation (AGENT_ROLE uniquement)
     * @dev Émet DepenseSoumise. Ne constitue pas encore la preuve publique finale.
     */
    function soumettreDepense(
        string calldata depenseId,
        string calldata communeId,
        uint256 montant,
        string calldata categorie,
        string calldata ipfsHash
    ) external whenNotPaused onlyRole(AGENT_ROLE) {
        require(bytes(depenseId).length > 0, "BudgetLedger: depenseId vide");
        require(bytes(communeId).length > 0, "BudgetLedger: communeId vide");
        
        // S8 : Vérification du scope commune
        require(
            keccak256(bytes(walletCommune[msg.sender])) == keccak256(bytes(communeId)),
            "BudgetLedger: cet agent n'est pas autorise pour cette commune"
        );

        require(montant > 0, "BudgetLedger: montant doit etre positif");
        require(bytes(categorie).length > 0, "BudgetLedger: categorie vide");
        require(bytes(ipfsHash).length > 0, "BudgetLedger: ipfsHash vide");

        _transactionCount++;

        emit DepenseSoumise(
            depenseId,
            communeId,
            montant,
            categorie,
            ipfsHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Valide définitivement une dépense sur la blockchain (MAIRE_ROLE uniquement)
     * @dev Émet DepenseValidee — c'est cet event qui constitue la preuve publique immuable.
     *      Le hash IPFS du justificatif est ancré dans cet event.
     *      Un auditeur peut vérifier : hash blockchain == hash du fichier PDF téléchargé.
     */
    function validerDepense(
        string calldata depenseId,
        string calldata communeId,
        uint256 montant,
        string calldata categorie,
        string calldata ipfsHash
    ) external whenNotPaused onlyRole(MAIRE_ROLE) {
        require(bytes(depenseId).length > 0, "BudgetLedger: depenseId vide");
        require(bytes(communeId).length > 0, "BudgetLedger: communeId vide");

        // S8 : Vérification du scope commune
        require(
            keccak256(bytes(walletCommune[msg.sender])) == keccak256(bytes(communeId)),
            "BudgetLedger: ce maire n'est pas autorise pour cette commune"
        );

        require(montant > 0, "BudgetLedger: montant doit etre positif");
        require(bytes(categorie).length > 0, "BudgetLedger: categorie vide");
        require(bytes(ipfsHash).length > 0, "BudgetLedger: ipfsHash vide");

        emit DepenseValidee(
            depenseId,
            communeId,
            montant,
            categorie,
            ipfsHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Soumet une recette en attente de validation (AGENT_ROLE uniquement)
     */
    function soumettreRecette(
        string calldata recetteId,
        string calldata communeId,
        uint256 montant,
        string calldata source,
        string calldata ipfsHash
    ) external whenNotPaused onlyRole(AGENT_ROLE) {
        require(bytes(recetteId).length > 0, "BudgetLedger: recetteId vide");
        require(bytes(communeId).length > 0, "BudgetLedger: communeId vide");
        
        require(
            keccak256(bytes(walletCommune[msg.sender])) == keccak256(bytes(communeId)),
            "BudgetLedger: cet agent n'est pas autorise pour cette commune"
        );

        require(montant > 0, "BudgetLedger: montant doit etre positif");
        require(bytes(source).length > 0, "BudgetLedger: source vide");

        emit RecetteSoumise(
            recetteId,
            communeId,
            montant,
            source,
            ipfsHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Enregistre/Valide une recette communale (MAIRE_ROLE uniquement)
     * @dev Émet RecetteEnregistree — recettes fiscales, subventions, dotations État.
     */
    function enregistrerRecette(
        string calldata recetteId,
        string calldata communeId,
        uint256 montant,
        string calldata source,
        string calldata ipfsHash
    ) external whenNotPaused onlyRole(MAIRE_ROLE) {
        require(bytes(recetteId).length > 0, "BudgetLedger: recetteId vide");
        require(bytes(communeId).length > 0, "BudgetLedger: communeId vide");

        // S8 : Vérification du scope commune
        require(
            keccak256(bytes(walletCommune[msg.sender])) == keccak256(bytes(communeId)),
            "BudgetLedger: ce maire n'est pas autorise pour cette commune"
        );

        require(montant > 0, "BudgetLedger: montant doit etre positif");
        require(bytes(source).length > 0, "BudgetLedger: source vide");

        emit RecetteEnregistree(
            recetteId,
            communeId,
            montant,
            source,
            ipfsHash,
            msg.sender,
            block.timestamp
        );
    }

    // ─── Gestion des rôles ────────────────────────────────────────────────────

    /**
     * @notice Attribue le rôle AGENT_ROLE à un wallet pour une commune précise
     * @param wallet Adresse du wallet de l'Agent Financier
     * @param communeId ID de la commune (string Django)
     */
    function attribuerRoleAgent(address wallet, string calldata communeId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(wallet != address(0), "BudgetLedger: adresse invalide");
        require(bytes(communeId).length > 0, "BudgetLedger: communeId vide");
        
        walletCommune[wallet] = communeId;
        _grantRole(AGENT_ROLE, wallet);
        emit AgentRoleAttribue(wallet, msg.sender, block.timestamp);
    }

    /**
     * @notice Attribue le rôle MAIRE_ROLE à un wallet pour une commune précise
     * @param wallet Adresse du wallet du Maire
     * @param communeId ID de la commune
     */
    function attribuerRoleMaire(address wallet, string calldata communeId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(wallet != address(0), "BudgetLedger: adresse invalide");
        require(bytes(communeId).length > 0, "BudgetLedger: communeId vide");
        
        walletCommune[wallet] = communeId;
        _grantRole(MAIRE_ROLE, wallet);
        emit MaireRoleAttribue(wallet, msg.sender, block.timestamp);
    }

    /**
     * @notice Révoque un rôle d'un wallet (DEFAULT_ADMIN_ROLE uniquement)
     * @param role   Bytes32 du rôle à révoquer (AGENT_ROLE ou MAIRE_ROLE)
     * @param wallet Adresse à révoquer
     */
    function revoquerRole(bytes32 role, address wallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(role, wallet);
    }

    /**
     * @notice Enregistre officiellement une dotation budgétaire sur la blockchain
     * @param communeId ID de la commune (string Django)
     * @param montant Montant alloué en FCFA
     */
    function enregistrerDotation(string calldata communeId, uint256 montant) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(communeId).length > 0, "BudgetLedger: communeId vide");
        require(montant > 0, "BudgetLedger: montant doit etre positif");
        
        emit DotationEnregistree(communeId, montant, block.timestamp);
    }


    // ─── Fonctions admin (pause d'urgence) ────────────────────────────────────

    /**
     * @notice Met le contrat en pause — bloque soumettreDepense/validerDepense/enregistrerRecette
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Reprend le contrat après une pause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ─── Vues ─────────────────────────────────────────────────────────────────

    /**
     * @notice Retourne le nombre total de transactions soumises (dépenses uniquement)
     */
    function totalTransactions() external view returns (uint256) {
        return _transactionCount;
    }

    /**
     * @notice Vérifie si une adresse possède le rôle Agent
     */
    function estAgent(address wallet) external view returns (bool) {
        return hasRole(AGENT_ROLE, wallet);
    }

    /**
     * @notice Vérifie si une adresse possède le rôle Maire
     */
    function estMaire(address wallet) external view returns (bool) {
        return hasRole(MAIRE_ROLE, wallet);
    }
}
