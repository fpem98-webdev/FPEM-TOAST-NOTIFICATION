/**
 * ========================================================================
 * FPEM NOTIFICATION SYSTEM v1.0
 * ========================================================================
 * 
 * Advanced Toast Notification System for Modern Web Applications
 * 
 * @author FIRMIN POLIQUIN EWANG MPUISSA
 * @Telegram https://t.me/fpem_ts
 * @version 1.0.0
 * @license MIT
 * @description Système de notifications toast avancé avec support complet
 *              de l'accessibilité, animations fluides, responsive design,
 *              et API moderne pour applications web professionnelles.
 * 
 * Features:
 * - ✅ Web Components avec Shadow DOM
 * - ✅ Accessibilité complète (ARIA, navigation clavier)
 * - ✅ Responsive design adaptatif
 * - ✅ Animations fluides et naturelles
 * - ✅ Actions personnalisées dans notifications
 * - ✅ Gestion mémoire optimisée
 * - ✅ Persistance des notifications importantes
 * - ✅ API Builder Pattern fluide
 * - ✅ Groupement intelligent des notifications
 * - ✅ Support TypeScript ready
 * - ✅ Intégration Web APIs modernes
 * 
 * ========================================================================
 */

'use strict';

/**
 * ========================================================================
 * FPEM NOTIFICATION WEB COMPONENT
 * ========================================================================
 * 
 * Composant Web représentant une notification toast individuelle.
 * Utilise Shadow DOM pour l'encapsulation et supporte toutes les
 * fonctionnalités modernes d'accessibilité et d'interaction.
 */
class FpemNotification extends HTMLElement {
  
  /**
   * Liste des attributs surveillés pour déclencher les mises à jour
   * automatiques du composant via attributeChangedCallback
   */
  static get observedAttributes() {
    return [
      'visible', 'type', 'title', 'message', 'persistent', 
      'show-close-button', 'icon', 'progress'
    ];
  }

  /**
   * Constructeur du composant de notification
   * Initialise le Shadow DOM, les styles et les event listeners
   */
  constructor() {
    super();

    // Timers internes pour gestion automatique
    this._autoCloseTimer = null;
    this._progressTimer = null;
    
    // Handlers stockés pour pouvoir les supprimer proprement
    this._boundHandlers = new Map();
    
    // Actions personnalisées définies par l'utilisateur
    this._customActions = [];

    // Création du Shadow DOM avec mode fermé pour sécurité
    this._shadowRoot = this.attachShadow({ mode: 'closed' });

    // Injection du template HTML et CSS complets
    this._shadowRoot.innerHTML = this._getTemplate();

    // Récupération des références vers les éléments internes
    this._cacheElementReferences();

    // Configuration des event listeners avec cleanup automatique
    this._setupEventListeners();

    // Support du focus et navigation clavier
    this._setupKeyboardNavigation();
  }

  /**
   * Génère le template HTML complet avec styles CSS intégrés
   * @returns {string} Template HTML avec styles encapsulés
   */
  _getTemplate() {
    return `
      <style>
        /* === STYLES DE BASE === */
        :host {
          --notif-bg: rgba(0,0,0,0.85);
          --notif-color: #ffffff;
          --notif-border-radius: 0.5rem;
          --notif-shadow: 0 4px 12px rgba(0,0,0,0.3);
          --notif-padding: 1rem;
          --notif-gap: 0.75rem;
          --notif-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          --notif-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          
          display: block;
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
          transition: var(--notif-transition);
          pointer-events: auto;
          cursor: pointer;
          user-select: none;
          max-width: min(400px, calc(100vw - 2rem));
          min-width: 280px;
          box-sizing: border-box;
          font-family: var(--notif-font-family);
          font-size: 0.875rem;
          line-height: 1.5;
        }

        /* === ÉTATS D'AFFICHAGE === */
        :host([visible]) {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        :host([type="success"]) {
          --notif-bg: linear-gradient(135deg, #10b981, #059669);
          --notif-color: #ffffff;
        }

        :host([type="error"]) {
          --notif-bg: linear-gradient(135deg, #ef4444, #dc2626);
          --notif-color: #ffffff;
        }

        :host([type="warning"]) {
          --notif-bg: linear-gradient(135deg, #f59e0b, #d97706);
          --notif-color: #1f2937;
        }

        :host([type="info"]) {
          --notif-bg: linear-gradient(135deg, #3b82f6, #2563eb);
          --notif-color: #ffffff;
        }

        /* === CONTAINER PRINCIPAL === */
        .notification-container {
          background: var(--notif-bg);
          color: var(--notif-color);
          border-radius: var(--notif-border-radius);
          box-shadow: var(--notif-shadow);
          padding: var(--notif-padding);
          display: flex;
          align-items: flex-start;
          gap: var(--notif-gap);
          position: relative;
          overflow: hidden;
        }

        .notification-container:focus-within {
          outline: 2px solid currentColor;
          outline-offset: 2px;
        }

        /* === ICÔNE === */
        .icon {
          font-size: 1.25rem;
          line-height: 1;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        /* === CONTENU PRINCIPAL === */
        .content {
          flex: 1;
          min-width: 0; /* Pour le text-overflow */
        }

        .title {
          font-weight: 600;
          font-size: 0.925rem;
          margin: 0 0 0.25rem 0;
          word-wrap: break-word;
        }

        .message {
          font-size: 0.875rem;
          margin: 0;
          opacity: 0.9;
          white-space: pre-line;
          word-wrap: break-word;
        }

        /* === ACTIONS PERSONNALISÉES === */
        .actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.75rem;
          flex-wrap: wrap;
        }

        .action-btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: currentColor;
          padding: 0.375rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--notif-transition);
          text-decoration: none;
          display: inline-block;
        }

        .action-btn:hover,
        .action-btn:focus {
          background: rgba(255,255,255,0.3);
          transform: translateY(-1px);
          outline: none;
        }

        /* === BOUTON DE FERMETURE === */
        .close-btn {
          background: transparent;
          border: none;
          color: currentColor;
          cursor: pointer;
          font-size: 1.125rem;
          line-height: 1;
          padding: 0.25rem;
          border-radius: 0.25rem;
          opacity: 0.7;
          transition: var(--notif-transition);
          flex-shrink: 0;
          margin-top: -0.125rem;
        }

        .close-btn:hover,
        .close-btn:focus {
          opacity: 1;
          background: rgba(0,0,0,0.1);
          outline: none;
        }

        /* === BARRE DE PROGRESSION === */
        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: rgba(255,255,255,0.3);
          transition: width 0.1s linear;
          border-radius: 0 0 var(--notif-border-radius) var(--notif-border-radius);
        }

        /* === RESPONSIVE DESIGN === */
        @media (max-width: 480px) {
          :host {
            max-width: calc(100vw - 1rem);
            min-width: auto;
            font-size: 0.8125rem;
          }

          .notification-container {
            padding: 0.875rem;
          }

          .actions {
            margin-top: 0.5rem;
          }

          .action-btn {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
          }
        }

        /* === ANIMATIONS PERSONNALISÉES === */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        :host([shake]) {
          animation: shake 0.5s ease-in-out;
        }

        /* === MODE SOMBRE AUTOMATIQUE === */
        @media (prefers-color-scheme: dark) {
          :host([type="custom"]) {
            --notif-bg: rgba(31,41,55,0.95);
            --notif-color: #f3f4f6;
          }
        }

        /* === RÉDUCTION DES ANIMATIONS === */
        @media (prefers-reduced-motion: reduce) {
          :host {
            transition: opacity 0.1s linear;
          }
          
          .action-btn:hover {
            transform: none;
          }
        }
      </style>

      <div class="notification-container" role="alert" tabindex="0">
        <span class="icon" part="icon" aria-hidden="true"></span>
        
        <div class="content" part="content">
          <div class="title" part="title"></div>
          <div class="message" part="message"></div>
          <div class="actions" part="actions"></div>
        </div>
        
        <button type="button" class="close-btn" part="close-btn" aria-label="Fermer la notification">
          <span aria-hidden="true">×</span>
        </button>
        
        <div class="progress-bar" part="progress-bar" role="progressbar" aria-hidden="true"></div>
      </div>
    `;
  }

  /**
   * Met en cache les références vers les éléments du Shadow DOM
   * pour éviter les requêtes répétées
   */
  _cacheElementReferences() {
    this._container = this._shadowRoot.querySelector('.notification-container');
    this._iconElem = this._shadowRoot.querySelector('.icon');
    this._titleElem = this._shadowRoot.querySelector('.title');
    this._messageElem = this._shadowRoot.querySelector('.message');
    this._actionsElem = this._shadowRoot.querySelector('.actions');
    this._closeBtn = this._shadowRoot.querySelector('.close-btn');
    this._progressBar = this._shadowRoot.querySelector('.progress-bar');
  }

  /**
   * Configure tous les event listeners avec références stockées
   * pour permettre un cleanup propre
   */
  _setupEventListeners() {
    // Handler pour bouton de fermeture
    const closeHandler = (e) => {
      e.stopPropagation();
      this._requestClose('close-button');
    };
    this._boundHandlers.set('close', closeHandler);
    this._closeBtn.addEventListener('click', closeHandler);

    // Handler pour clic sur notification (si non persistante)
    const clickHandler = (e) => {
      if (!this.persistent && e.target === this._container) {
        this._requestClose('click');
      }
    };
    this._boundHandlers.set('click', clickHandler);
    this._container.addEventListener('click', clickHandler);

    // Handler pour événements personnalisés
    const actionHandler = (e) => {
      if (e.target.matches('.action-btn')) {
        const actionId = e.target.dataset.actionId;
        const action = this._customActions.find(a => a.id === actionId);
        if (action && action.callback) {
          action.callback(this, e);
        }
      }
    };
    this._boundHandlers.set('action', actionHandler);
    this._actionsElem.addEventListener('click', actionHandler);
  }

  /**
   * Configure la navigation au clavier pour l'accessibilité
   */
  _setupKeyboardNavigation() {
    const keyHandler = (e) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          this._requestClose('keyboard');
          break;
        
        case 'Enter':
        case ' ':
          if (e.target === this._container && !this.persistent) {
            e.preventDefault();
            this._requestClose('keyboard');
          }
          break;
      }
    };
    
    this._boundHandlers.set('keyboard', keyHandler);
    this._container.addEventListener('keydown', keyHandler);
  }

  /**
   * Émet une demande de fermeture vers le gestionnaire parent
   * @param {string} reason - Raison de la fermeture
   */
  _requestClose(reason = 'unknown') {
    this.dispatchEvent(new CustomEvent('fpemnotif:close-requested', {
      bubbles: true,
      composed: true,
      detail: { reason, notification: this }
    }));
  }

  /**
   * Callback appelé automatiquement lors des changements d'attributs
   * @param {string} name - Nom de l'attribut modifié
   * @param {string} oldVal - Ancienne valeur
   * @param {string} newVal - Nouvelle valeur
   */
  attributeChangedCallback(name, oldVal, newVal) {
    if (!this._container) return; // Pas encore initialisé

    switch (name) {
      case 'visible':
        this._handleVisibilityChange();
        break;
        
      case 'icon':
        this._updateIcon(newVal);
        break;
        
      case 'title':
        this._updateTitle(newVal);
        break;
        
      case 'message':
        this._updateMessage(newVal);
        break;
        
      case 'show-close-button':
        this._updateCloseButton();
        break;
        
      case 'persistent':
        this._updatePersistentState();
        break;
        
      case 'type':
        this._updateTheme(newVal);
        break;
        
      case 'progress':
        this._updateProgress(newVal);
        break;
    }
  }

  /**
   * Gère les changements de visibilité avec focus management
   */
  _handleVisibilityChange() {
    if (this.hasAttribute('visible')) {
      // Notification devient visible
      requestAnimationFrame(() => {
        this._container.focus({ preventScroll: true });
      });
    }
  }

  /**
   * Met à jour l'icône affichée
   * @param {string} iconValue - Nouvelle icône (emoji, caractère, etc.)
   */
  _updateIcon(iconValue) {
    this._iconElem.textContent = iconValue || '';
    this._iconElem.style.display = iconValue ? '' : 'none';
  }

  /**
   * Met à jour le titre de la notification
   * @param {string} titleValue - Nouveau titre
   */
  _updateTitle(titleValue) {
    this._titleElem.textContent = titleValue || '';
    this._titleElem.style.display = titleValue ? '' : 'none';
  }

  /**
   * Met à jour le message de la notification
   * @param {string} messageValue - Nouveau message
   */
  _updateMessage(messageValue) {
    this._messageElem.textContent = messageValue || '';
    this._messageElem.style.display = messageValue ? '' : 'none';
  }

  /**
   * Met à jour la visibilité du bouton de fermeture
   */
  _updateCloseButton() {
    const shouldShow = this.hasAttribute('show-close-button');
    this._closeBtn.style.display = shouldShow ? '' : 'none';
  }

  /**
   * Met à jour l'état persistant de la notification
   */
  _updatePersistentState() {
    // Mise à jour du cursor pour indiquer la cliquabilité
    const isPersistent = this.hasAttribute('persistent');
    this._container.style.cursor = isPersistent ? 'default' : 'pointer';
  }

  /**
   * Applique le thème visuel selon le type de notification
   * @param {string} type - Type de notification (success, error, etc.)
   */
  _updateTheme(type) {
    // Les styles CSS se chargent automatiquement via les attributs
    // Cette méthode peut être étendue pour des thèmes plus complexes
    
    // Mise à jour de l'icône par défaut selon le type
    if (!this.hasAttribute('icon')) {
      const defaultIcons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        custom: ''
      };
      this._updateIcon(defaultIcons[type] || defaultIcons.custom);
    }
  }

  /**
   * Met à jour la barre de progression
   * @param {string} progressValue - Valeur de progression (0-100)
   */
  _updateProgress(progressValue) {
    const progress = Math.max(0, Math.min(100, parseInt(progressValue) || 0));
    this._progressBar.style.width = `${progress}%`;
    this._progressBar.setAttribute('aria-valuenow', progress);
    this._progressBar.style.display = progress > 0 ? 'block' : 'none';
  }

  /**
   * Appelé quand l'élément est ajouté au DOM
   */
  connectedCallback() {
    // Application des états initiaux
    this._updateCloseButton();
    this._updateTitle(this.getAttribute('title'));
    this._updateMessage(this.getAttribute('message'));
    this._updateIcon(this.getAttribute('icon'));
    this._updateTheme(this.getAttribute('type') || 'custom');
    this._updateProgress(this.getAttribute('progress'));
  }

  /**
   * Appelé quand l'élément est supprimé du DOM
   * Nettoie toutes les références pour éviter les fuites mémoire
   */
  disconnectedCallback() {
    this._cleanup();
  }

  /**
   * Nettoie tous les timers, listeners et références
   */
  _cleanup() {
    // Nettoyage des timers
    if (this._autoCloseTimer) {
      clearTimeout(this._autoCloseTimer);
      this._autoCloseTimer = null;
    }
    
    if (this._progressTimer) {
      clearInterval(this._progressTimer);
      this._progressTimer = null;
    }

    // Suppression des event listeners
    this._boundHandlers.forEach((handler, key) => {
      switch (key) {
        case 'close':
          this._closeBtn?.removeEventListener('click', handler);
          break;
        case 'click':
          this._container?.removeEventListener('click', handler);
          break;
        case 'action':
          this._actionsElem?.removeEventListener('click', handler);
          break;
        case 'keyboard':
          this._container?.removeEventListener('keydown', handler);
          break;
      }
    });
    
    this._boundHandlers.clear();
  }

  /**
   * Ajoute des actions personnalisées à la notification
   * @param {Array} actions - Tableau d'objets action {label, callback, id}
   */
  setActions(actions = []) {
    this._customActions = actions;
    this._renderActions();
  }

  /**
   * Génère le HTML pour les actions personnalisées
   */
  _renderActions() {
    if (!this._customActions.length) {
      this._actionsElem.style.display = 'none';
      return;
    }

    this._actionsElem.innerHTML = this._customActions
      .map(action => `
        <button 
          type="button" 
          class="action-btn" 
          data-action-id="${action.id || Math.random().toString(36).substr(2, 9)}"
          ${action.primary ? 'data-primary="true"' : ''}
        >
          ${this._escapeHtml(action.label || 'Action')}
        </button>
      `)
      .join('');

    this._actionsElem.style.display = '';
  }

  /**
   * Échappe le HTML pour éviter les injections XSS
   * @param {string} text - Texte à échapper
   * @returns {string} Texte échappé
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Démarre une animation de progression automatique
   * @param {number} duration - Durée en millisecondes
   */
  startProgressAnimation(duration = 3000) {
    let startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      
      this.setAttribute('progress', progress.toString());
      
      if (progress < 100) {
        this._progressTimer = requestAnimationFrame(updateProgress);
      } else {
        this._progressTimer = null;
      }
    };
    
    updateProgress();
  }

  // === PROPRIÉTÉS PUBLIQUES ===

  /** Gestion de la visibilité */
  get visible() { return this.hasAttribute('visible'); }
  set visible(val) { 
    if (val) this.setAttribute('visible', '');
    else this.removeAttribute('visible');
  }

  /** Gestion de la persistance */
  get persistent() { return this.hasAttribute('persistent'); }
  set persistent(val) { 
    if (val) this.setAttribute('persistent', '');
    else this.removeAttribute('persistent');
  }

  /** Gestion du bouton de fermeture */
  get showCloseButton() { return this.hasAttribute('show-close-button'); }
  set showCloseButton(val) { 
    if (val) this.setAttribute('show-close-button', '');
    else this.removeAttribute('show-close-button');
  }

  /** Propriétés de contenu */
  get type() { return this.getAttribute('type') || 'custom'; }
  set type(val) { this.setAttribute('type', val); }

  get title() { return this.getAttribute('title') || ''; }
  set title(val) { this.setAttribute('title', val); }

  get message() { return this.getAttribute('message') || ''; }
  set message(val) { this.setAttribute('message', val); }

  get icon() { return this.getAttribute('icon'); }
  set icon(val) { 
    if (val === undefined || val === null) this.removeAttribute('icon');
    else this.setAttribute('icon', val);
  }

  get progress() { return parseInt(this.getAttribute('progress')) || 0; }
  set progress(val) { this.setAttribute('progress', Math.max(0, Math.min(100, val)).toString()); }
}

/**
 * ========================================================================
 * FPEM NOTIFICATION BUILDER
 * ========================================================================
 * 
 * Builder pattern pour créer des notifications de manière fluide
 * Permet un enchaînement d'appels pour une API plus ergonomique
 */
class FpemNotificationBuilder {
  
  /**
   * Constructeur du builder
   * @param {FpemNotif} manager - Instance du gestionnaire de notifications
   * @param {string} type - Type de notification
   */
  constructor(manager, type) {
    this._manager = manager;
    this._options = { type };
  }

  /**
   * Définit le titre de la notification
   * @param {string} title - Titre
   * @returns {FpemNotificationBuilder} Instance pour chaînage
   */
  title(title) {
    this._options.title = title;
    return this;
  }

  /**
   * Définit le message de la notification
   * @param {string} message - Message
   * @returns {FpemNotificationBuilder} Instance pour chaînage
   */
  message(message) {
    this._options.message = message;
    return this;
  }

  /**
   * Définit l'icône de la notification
   * @param {string} icon - Icône (emoji, caractère)
   * @returns {FpemNotificationBuilder} Instance pour chaînage
   */
  icon(icon) {
    this._options.icon = icon;
    return this;
  }

  /**
   * Définit la durée d'affichage
   * @param {number} duration - Durée en millisecondes
   * @returns {FpemNotificationBuilder} Instance pour chaînage
   */
  duration(duration) {
    this._options.duration = duration;
    return this;
  }

  /**
   * Rend la notification persistante
   * @param {boolean} persistent - État persistant
   * @returns {FpemNotificationBuilder} Instance pour chaînage
   */
  persistent(persistent = true) {
    this._options.persistent = persistent;
    return this;
  }

  /**
   * Affiche le bouton de fermeture
   * @param {boolean} show - Afficher le bouton
   * @returns {FpemNotificationBuilder} Instance pour chaînage
   */
  closable(show = true) {
    this._options.showCloseButton = show;
    return this;
  }

  /**
   * Définit un ID personnalisé
   * @param {string} id - ID unique
   * @returns {FpemNotificationBuilder} Instance pour chaînage
   */
  id(id) {
    this._options.id = id;
    return this;
  }

  /**
   * Ajoute des actions personnalisées
   * @param {Array} actions - Tableau d'actions
   * @returns {FpemNotificationBuilder} Instance pour chaînage
   */
  actions(actions) {
    this._options.actions = actions;
    return this;
  }

  /**
   * Ajoute une action personnalisée
   * @param {string} label - Libellé du bouton
   * @param {function} callback - Fonction de callback
   * @param {boolean} primary - Action principale
   * @returns {FpemNotificationBuilder} Instance pour chaînage
   */
  action(label, callback, primary = false) {
    if (!this._options.actions) this._options.actions = [];
    this._options.actions.push({
      label,
      callback,
      primary,
      id: Math.random().toString(36).substr(2, 9)
    });
    return this;
  }

  /**
   * Définit la position spécifique pour cette notification
   * @param {string} position - Position d'affichage
   * @returns {FpemNotificationBuilder} Instance pour chaînage
   */
  position(position) {
    this._options.position = position;
    return this;
  }

  /**
   * Ajoute une barre de progression
   * @param {boolean} showProgress - Afficher la progression
   * @returns {FpemNotificationBuilder} Instance pour chaînage
   */
  progress(showProgress = true) {
    this._options.showProgress = showProgress;
    return this;
  }

  /**
   * Définit un callback de fermeture
   * @param {function} callback - Fonction appelée à la fermeture
   * @returns {FpemNotificationBuilder} Instance pour chaînage
   */
  onClose(callback) {
    this._options.onClose = callback;
    return this;
  }

  /**
   * Affiche la notification avec les options définies
   * @returns {HTMLElement} Élément de notification créé
   */
  show() {
    return this._manager.notify(this._options.type, this._options);
  }

  /**
   * Programme l'affichage après un délai
   * @param {number} delay - Délai en millisecondes
   * @returns {Promise<HTMLElement>} Promise résolue avec l'élément notification
   */
  showAfter(delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.show());
      }, delay);
    });
  }
}

/**
 * ========================================================================
 * FPEM NOTIFICATION MANAGER
 * ========================================================================
 * 
 * Gestionnaire principal des notifications avec fonctionnalités avancées:
 * - Gestion de la file d'attente et limitation
 * - Groupement intelligent des notifications
 * - Persistance des notifications importantes
 * - API moderne et extensible
 */
class FpemNotif {

  // Configuration par défaut du système
  static defaultOptions = {
    position: 'bottom-right',
    duration: 4000,
    animationDuration: 300,
    maxVisible: 5,
    maxQueue: 10,
    ariaLive: 'polite',
    groupSimilar: true,
    groupTimeout: 2000,
    enablePersistence: false,
    enableKeyboardShortcuts: true,
    enableSounds: false,
    theme: 'auto'
  };

  // Positions disponibles pour l'affichage
  static positions = new Set([
    'top-left', 'top-right', 'bottom-left', 'bottom-right',
    'top-center', 'bottom-center', 'center'
  ]);

  /**
   * Constructeur du gestionnaire de notifications
   * @param {Object} options - Options de configuration
   */
  constructor(options = {}) {
    // Fusion des options avec les valeurs par défaut
    this.config = { ...FpemNotif.defaultOptions, ...options };
    
    // Validation des options critiques
    this._validateOptions();

    // Collections pour la gestion des notifications
    this.notifications = new Map();        // Notifications actives
    this.queue = [];                       // File d'attente des notifications
    this.groups = new Map();               // Groupes de notifications similaires
    
    // Compteurs et état interne
    this._idCounter = 1;
    this._isProcessingQueue = false;
    this._persistenceKey = 'fpem-notifications-v2';
    
    // Containers pour différentes positions
    this._containers = new Map();
    
    // Initialisation du système
    this._initialize();
  }

  /**
   * Valide les options de configuration du gestionnaire
   * @throws {Error} Si les options sont invalides
   */
  _validateOptions() {
    if (!FpemNotif.positions.has(this.config.position)) {
      console.warn(`[FPEM NOTIF] Position invalide: ${this.config.position}, utilisation de 'bottom-right'`);
      this.config.position = 'bottom-right';
    }

    if (this.config.maxVisible < 1 || this.config.maxVisible > 20) {
      console.warn(`[FPEM NOTIF] maxVisible invalide: ${this.config.maxVisible}, utilisation de 5`);
      this.config.maxVisible = 5;
    }

    if (this.config.duration < 0) {
      console.warn(`[FPEM NOTIF] duration invalide: ${this.config.duration}, utilisation de 4000ms`);
      this.config.duration = 4000;
    }
  }

  /**
   * Initialise le système de notifications
   */
  _initialize() {
    // Création du container principal
    this._createMainContainer();
    
    // Configuration des raccourcis clavier globaux
    if (this.config.enableKeyboardShortcuts) {
      this._setupGlobalKeyboardShortcuts();
    }
    
    // Restauration des notifications persistantes
    if (this.config.enablePersistence) {
      this._restorePersistedNotifications();
    }
    
    // Configuration de la détection du thème
    this._setupThemeDetection();
    
    // Nettoyage automatique périodique
    this._setupPeriodicCleanup();
  }

  /**
   * Crée le container principal pour la position définie
   */
  _createMainContainer() {
    const container = this._createContainer(this.config.position);
    this._containers.set(this.config.position, container);
    document.body.appendChild(container);
  }

  /**
   * Crée un container pour une position spécifique
   * @param {string} position - Position du container
   * @returns {HTMLElement} Container créé
   */
  _createContainer(position) {
    const container = document.createElement('div');
    container.className = 'fpem-notifications-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-live', this.config.ariaLive);
    container.setAttribute('aria-label', 'Zone de notifications');
    container.dataset.position = position;

    // Styles CSS complets pour le container
    Object.assign(container.style, {
      position: 'fixed',
      zIndex: '9999999',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      maxWidth: '420px',
      minWidth: '280px',
      pointerEvents: 'none',
      fontFamily: this.config.fontFamily || 'system-ui, sans-serif',
      fontSize: '14px'
    });

    this._applyContainerPosition(container, position);
    
    // Event listener pour les demandes de fermeture
    container.addEventListener('fpemnotif:close-requested', (e) => {
      this._handleCloseRequest(e);
    });

    return container;
  }

  /**
   * Applique le positionnement CSS au container
   * @param {HTMLElement} container - Container à positionner
   * @param {string} position - Position désirée
   */
  _applyContainerPosition(container, position) {
    const positions = {
      'top-left': { 
        top: '1rem', left: '1rem', right: 'auto', bottom: 'auto',
        alignItems: 'flex-start', transform: 'none'
      },
      'top-right': { 
        top: '1rem', right: '1rem', left: 'auto', bottom: 'auto',
        alignItems: 'flex-end', transform: 'none'
      },
      'bottom-left': { 
        bottom: '1rem', left: '1rem', right: 'auto', top: 'auto',
        alignItems: 'flex-start', transform: 'none',
        flexDirection: 'column-reverse'
      },
      'bottom-right': { 
        bottom: '1rem', right: '1rem', left: 'auto', top: 'auto',
        alignItems: 'flex-end', transform: 'none',
        flexDirection: 'column-reverse'
      },
      'top-center': { 
        top: '1rem', left: '50%', right: 'auto', bottom: 'auto',
        alignItems: 'center', transform: 'translateX(-50%)'
      },
      'bottom-center': { 
        bottom: '1rem', left: '50%', right: 'auto', top: 'auto',
        alignItems: 'center', transform: 'translateX(-50%)',
        flexDirection: 'column-reverse'
      },
      'center': { 
        top: '50%', left: '50%', right: 'auto', bottom: 'auto',
        alignItems: 'center', transform: 'translate(-50%, -50%)'
      }
    };

    const pos = positions[position] || positions['bottom-right'];
    
    Object.entries(pos).forEach(([prop, value]) => {
      if (prop === 'flexDirection') {
        container.style.flexDirection = value;
      } else {
        container.style[prop] = value;
      }
    });
  }

  /**
   * Configure les raccourcis clavier globaux
   */
  _setupGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Échap pour fermer toutes les notifications non persistantes
      if (e.key === 'Escape' && e.ctrlKey) {
        e.preventDefault();
        this.clearNonPersistent();
      }
      
      // Ctrl+Shift+N pour afficher le nombre de notifications
      if (e.key === 'N' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        this._announceNotificationCount();
      }
    });
  }

  /**
   * Annonce le nombre de notifications pour l'accessibilité
   */
  _announceNotificationCount() {
    const count = this.notifications.size;
    const message = count === 0 
      ? 'Aucune notification active'
      : `${count} notification${count > 1 ? 's' : ''} active${count > 1 ? 's' : ''}`;
    
    // Création d'un élément temporaire pour l'annonce ARIA
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    setTimeout(() => document.body.removeChild(announcer), 1000);
  }

  /**
   * Restaure les notifications persistantes depuis le stockage local
   */
  _restorePersistedNotifications() {
    try {
      const stored = localStorage.getItem(this._persistenceKey);
      if (!stored) return;

      const notifications = JSON.parse(stored);
      notifications.forEach(notifData => {
        if (notifData.persistent && this._shouldRestoreNotification(notifData)) {
          // Restauration avec un délai pour éviter le spam au chargement
          setTimeout(() => {
            this.notify(notifData.type, {
              ...notifData,
              restored: true
            });
          }, 500);
        }
      });
    } catch (error) {
      console.warn('[FPEM NOTIF] Erreur lors de la restauration des notifications:', error);
    }
  }

  /**
   * Détermine si une notification doit être restaurée
   * @param {Object} notifData - Données de la notification
   * @returns {boolean} Vrai si la notification doit être restaurée
   */
  _shouldRestoreNotification(notifData) {
    // Ne pas restaurer les notifications trop anciennes (> 24h)
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures
    const age = Date.now() - (notifData.timestamp || 0);
    
    return age < maxAge && notifData.restoreOnLoad !== false;
  }

  /**
   * Sauvegarde les notifications persistantes
   */
  _persistNotifications() {
    if (!this.config.enablePersistence) return;

    try {
      const toStore = Array.from(this.notifications.values())
        .filter(notif => notif.persistent)
        .map(notif => ({
          id: notif.dataset.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          icon: notif.icon,
          persistent: true,
          timestamp: Date.now(),
          restoreOnLoad: notif.dataset.restoreOnLoad !== 'false'
        }));

      localStorage.setItem(this._persistenceKey, JSON.stringify(toStore));
    } catch (error) {
      console.warn('[FPEM NOTIF] Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Configure la détection automatique du thème
   */
  _setupThemeDetection() {
    if (this.config.theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      document.documentElement.setAttribute(
        'data-fpem-theme', 
        mediaQuery.matches ? 'dark' : 'light'
      );
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
  }

  /**
   * Met en place un nettoyage périodique automatique
   */
  _setupPeriodicCleanup() {
    // Nettoyage toutes les 5 minutes
    setInterval(() => {
      this._cleanupExpiredGroups();
      this._processQueue();
    }, 5 * 60 * 1000);
  }

  /**
   * Nettoie les groupes de notifications expirés
   */
  _cleanupExpiredGroups() {
    const now = Date.now();
    const expiredGroups = [];

    this.groups.forEach((group, key) => {
      if (now - group.lastUpdate > this.config.groupTimeout) {
        expiredGroups.push(key);
      }
    });

    expiredGroups.forEach(key => this.groups.delete(key));
  }

  /**
   * Génère un ID unique pour les notifications
   * @returns {string} ID unique
   */
  _generateId() {
    return `fpem-notif-${this._idCounter++}-${Date.now()}`;
  }

  /**
   * Génère une clé de groupe pour des notifications similaires
   * @param {string} type - Type de notification
   * @param {Object} options - Options de la notification
   * @returns {string} Clé de groupe
   */
  _generateGroupKey(type, options) {
    if (!this.config.groupSimilar) return null;
    
    // Groupement basé sur le type et le titre
    const groupableFields = [type, options.title || ''].filter(Boolean);
    return groupableFields.length > 1 ? groupableFields.join('|') : null;
  }

  /**
   * Gère le groupement des notifications similaires
   * @param {string} groupKey - Clé du groupe
   * @param {Object} options - Options de la notification
   * @returns {Object|null} Notification groupée existante ou null
   */
  _handleGrouping(groupKey, options) {
    if (!groupKey) return null;

    const now = Date.now();
    const existing = this.groups.get(groupKey);

    if (existing && (now - existing.lastUpdate) < this.config.groupTimeout) {
      // Mise à jour du groupe existant
      existing.count++;
      existing.lastUpdate = now;
      existing.lastMessage = options.message;

      // Mise à jour de la notification visible
      const notification = this.notifications.get(existing.notificationId);
      if (notification) {
        const countText = existing.count > 1 ? ` (${existing.count})` : '';
        notification.title = (options.title || '') + countText;
        
        if (options.message) {
          notification.message = options.message;
        }

        // Animation de mise à jour
        notification.setAttribute('shake', '');
        setTimeout(() => notification.removeAttribute('shake'), 500);

        return { grouped: true, notification, count: existing.count };
      }
    }

    return null;
  }

  /**
   * Crée une nouvelle notification
   * @param {string} type - Type de notification
   * @param {Object} options - Options de configuration
   * @returns {HTMLElement} Notification créée
   */
  notify(type, options = {}) {
    // Validation et normalisation des paramètres
    const validatedOptions = this._validateAndNormalizeOptions(type, options);
    const id = validatedOptions.id || this._generateId();

    // Vérification si mise à jour d'une notification existante
    if (this.notifications.has(id)) {
      return this._updateExistingNotification(id, validatedOptions);
    }

    // Gestion du groupement
    const groupKey = this._generateGroupKey(type, validatedOptions);
    if (groupKey) {
      const groupResult = this._handleGrouping(groupKey, validatedOptions);
      if (groupResult?.grouped) {
        return groupResult.notification;
      }
    }

    // Vérification de la limite de notifications visibles
    if (this.notifications.size >= this.config.maxVisible) {
      this._handleMaxVisibleExceeded(validatedOptions);
      return null;
    }

    // Création de la notification
    const notification = this._createNotificationElement(type, validatedOptions, id);
    
    // Enregistrement dans les collections
    this.notifications.set(id, notification);
    
    // Enregistrement du groupe si applicable
    if (groupKey) {
      this.groups.set(groupKey, {
        notificationId: id,
        count: 1,
        lastUpdate: Date.now(),
        lastMessage: validatedOptions.message
      });
    }

    // Ajout au DOM avec container approprié
    const container = this._getOrCreateContainer(validatedOptions.position || this.config.position);
    container.appendChild(notification);

    // Animation d'apparition
    this._animateNotificationIn(notification, validatedOptions);

    // Configuration de la fermeture automatique
    this._setupAutoClose(notification, validatedOptions);

    // Émission d'événements
    this._emitEvent('added', { notification, type, options: validatedOptions, id });

    // Sauvegarde si persistante
    if (validatedOptions.persistent) {
      this._persistNotifications();
    }

    return notification;
  }

  /**
   * Valide et normalise les options de notification
   * @param {string} type - Type de notification
   * @param {Object} options - Options brutes
   * @returns {Object} Options validées et normalisées
   */
  _validateAndNormalizeOptions(type, options) {
    const normalized = { ...options };

    // Validation du type
    const validTypes = ['success', 'error', 'warning', 'info', 'custom'];
    if (!validTypes.includes(type)) {
      console.warn(`[FPEM NOTIF] Type invalide: ${type}, utilisation de 'custom'`);
      type = 'custom';
    }

    // Sanitisation du contenu HTML
    if (normalized.title) {
      normalized.title = this._sanitizeContent(normalized.title);
    }
    if (normalized.message) {
      normalized.message = this._sanitizeContent(normalized.message);
    }

    // Validation de la durée
    if (normalized.duration !== undefined) {
      normalized.duration = Math.max(0, parseInt(normalized.duration) || 0);
    }

    // Validation des actions
    if (normalized.actions && Array.isArray(normalized.actions)) {
      normalized.actions = normalized.actions
        .filter(action => action && typeof action.label === 'string')
        .map(action => ({
          ...action,
          label: this._sanitizeContent(action.label),
          id: action.id || this._generateId()
        }));
    }

    return normalized;
  }

  /**
   * Sanitise le contenu pour éviter les injections XSS
   * @param {string} content - Contenu à sanitiser
   * @returns {string} Contenu sanitisé
   */
  _sanitizeContent(content) {
    if (typeof content !== 'string') return '';
    
    const tempDiv = document.createElement('div');
    tempDiv.textContent = content;
    return tempDiv.innerHTML;
  }

  /**
   * Met à jour une notification existante
   * @param {string} id - ID de la notification
   * @param {Object} options - Nouvelles options
   * @returns {HTMLElement} Notification mise à jour
   */
  _updateExistingNotification(id, options) {
    const notification = this.notifications.get(id);
    if (!notification) return null;

    // Mise à jour des propriétés
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && notification.hasOwnProperty(key)) {
        notification[key] = value;
      }
    });

    // Mise à jour des actions si spécifiées
    if (options.actions) {
      notification.setActions(options.actions);
    }

    // Réinitialisation du timer de fermeture si nécessaire
    if (!options.persistent && options.duration) {
      this._setupAutoClose(notification, options);
    }

    // Animation de mise à jour
    notification.setAttribute('shake', '');
    setTimeout(() => notification.removeAttribute('shake'), 500);

    this._emitEvent('updated', { notification, id, options });

    return notification;
  }

  /**
   * Gère le dépassement de la limite de notifications visibles
   * @param {Object} options - Options de la nouvelle notification
   */
  _handleMaxVisibleExceeded(options) {
    if (options.priority === 'high') {
      // Pour les notifications prioritaires, supprimer la plus ancienne
      const oldestId = this.notifications.keys().next().value;
      if (oldestId) {
        this.removeById(oldestId);
      }
    } else {
      // Sinon, ajouter à la file d'attente
      if (this.queue.length < this.config.maxQueue) {
        this.queue.push({ type: options.type, options });
      }
    }
  }

  /**
   * Obtient ou crée un container pour une position spécifique
   * @param {string} position - Position désirée
   * @returns {HTMLElement} Container pour cette position
   */
  _getOrCreateContainer(position) {
    if (!this._containers.has(position)) {
      const container = this._createContainer(position);
      this._containers.set(position, container);
      document.body.appendChild(container);
    }
    return this._containers.get(position);
  }

  /**
   * Crée l'élément DOM de la notification
   * @param {string} type - Type de notification
   * @param {Object} options - Options de configuration
   * @param {string} id - ID unique
   * @returns {HTMLElement} Élément notification
   */
  _createNotificationElement(type, options, id) {
    const notification = document.createElement('fpem-notification');
    
    // Attribution des propriétés de base
    notification.dataset.id = id;
    notification.dataset.timestamp = Date.now().toString();
    notification.type = type;
    
    // Configuration du contenu
    if (options.title) notification.title = options.title;
    if (options.message) notification.message = options.message;
    if (options.icon !== undefined) notification.icon = options.icon;
    
    // Configuration du comportement
    notification.persistent = !!options.persistent;
    notification.showCloseButton = !!options.showCloseButton;
    
    // Configuration des options avancées
    if (options.restoreOnLoad !== undefined) {
      notification.dataset.restoreOnLoad = options.restoreOnLoad.toString();
    }
    
    // Configuration de la progression
    if (options.showProgress) {
      notification.setAttribute('progress', '0');
      if (options.duration && !options.persistent) {
        notification.startProgressAnimation(options.duration);
      }
    }

    // Configuration des actions personnalisées
    if (options.actions && options.actions.length > 0) {
      notification.setActions(options.actions);
    }

    // Application du thème personnalisé
    if (options.theme) {
      this._applyCustomTheme(notification, options.theme);
    }

    // Stockage du callback de fermeture
    if (options.onClose) {
      notification._onCloseCallback = options.onClose;
    }

    return notification;
  }

  /**
   * Applique un thème personnalisé à la notification
   * @param {HTMLElement} notification - Élément notification
   * @param {Object} theme - Thème à appliquer
   */
  _applyCustomTheme(notification, theme) {
    if (theme.background) {
      notification.style.setProperty('--notif-bg', theme.background);
    }
    if (theme.color) {
      notification.style.setProperty('--notif-color', theme.color);
    }
    if (theme.borderRadius) {
      notification.style.setProperty('--notif-border-radius', theme.borderRadius);
    }
    if (theme.shadow) {
      notification.style.setProperty('--notif-shadow', theme.shadow);
    }
  }

  /**
   * Lance l'animation d'apparition de la notification
   * @param {HTMLElement} notification - Notification à animer
   * @param {Object} options - Options d'animation
   */
  _animateNotificationIn(notification, options) {
    // Animation CSS via l'attribut visible
    requestAnimationFrame(() => {
      notification.visible = true;
      
      // Focus pour l'accessibilité
      if (options.autoFocus !== false) {
        notification.focus({ preventScroll: true });
      }
    });

    // Son de notification si activé
    if (this.config.enableSounds && options.sound !== false) {
      this._playNotificationSound(notification.type);
    }
  }

  /**
   * Joue un son de notification selon le type
   * @param {string} type - Type de notification
   */
  _playNotificationSound(type) {
    // Utilisation de l'API Web Audio si disponible
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      try {
        const audioContext = new (AudioContext || webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Fréquences selon le type
        const frequencies = {
          success: 800,
          error: 400,
          warning: 600,
          info: 500,
          custom: 450
        };

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequencies[type] || 450, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        console.warn('[FPEM NOTIF] Erreur lors de la lecture du son:', error);
      }
    }
  }

  /**
   * Configure la fermeture automatique d'une notification
   * @param {HTMLElement} notification - Notification à configurer
   * @param {Object} options - Options de fermeture
   */
  _setupAutoClose(notification, options) {
    // Nettoyage du timer existant
    if (notification._autoCloseTimer) {
      clearTimeout(notification._autoCloseTimer);
    }

    // Configuration du nouveau timer si non persistante
    if (!options.persistent) {
      const duration = options.duration || this.config.duration;
      
      notification._autoCloseTimer = setTimeout(() => {
        this.removeById(notification.dataset.id);
      }, duration);
    }
  }

  /**
   * Gère les demandes de fermeture des notifications
   * @param {Event} event - Événement de demande de fermeture
   */
  _handleCloseRequest(event) {
    const notification = event.target;
    const id = notification.dataset.id;
    const reason = event.detail?.reason || 'unknown';

    if (id) {
      this.removeById(id, reason);
    }
  }

  /**
   * Supprime une notification par son ID
   * @param {string} id - ID de la notification
   * @param {string} reason - Raison de la suppression
   * @returns {boolean} Vrai si supprimée avec succès
   */
  removeById(id, reason = 'manual') {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    // Animation de sortie
    notification.visible = false;

    // Nettoyage des timers
    if (notification._autoCloseTimer) {
      clearTimeout(notification._autoCloseTimer);
    }

    // Appel du callback de fermeture
    if (notification._onCloseCallback) {
      try {
        notification._onCloseCallback(notification, reason);
      } catch (error) {
        console.error('[FPEM NOTIF] Erreur dans le callback de fermeture:', error);
      }
    }

    // Suppression après animation
    setTimeout(() => {
      // Retrait du DOM
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }

      // Suppression des collections
      this.notifications.delete(id);

      // Nettoyage des groupes
      this._cleanupGroupForNotification(id);

      // Émission d'événement
      this._emitEvent('removed', { notification, id, reason });

      // Traitement de la file d'attente
      this._processQueue();

      // Mise à jour de la persistance
      this._persistNotifications();

    }, this.config.animationDuration);

    return true;
  }

  /**
   * Nettoie les groupes associés à une notification supprimée
   * @param {string} notificationId - ID de la notification
   */
  _cleanupGroupForNotification(notificationId) {
    const groupToDelete = [];
    
    this.groups.forEach((group, key) => {
      if (group.notificationId === notificationId) {
        groupToDelete.push(key);
      }
    });

    groupToDelete.forEach(key => this.groups.delete(key));
  }

  /**
   * Traite la file d'attente des notifications
   */
  _processQueue() {
    if (this._isProcessingQueue || this.queue.length === 0) return;
    if (this.notifications.size >= this.config.maxVisible) return;

    this._isProcessingQueue = true;

    // Traitement du prochain élément
    const next = this.queue.shift();
    if (next) {
      this.notify(next.type, next.options);
    }

    this._isProcessingQueue = false;

    // Récursion si encore de la place et des éléments en attente
    if (this.queue.length > 0 && this.notifications.size < this.config.maxVisible) {
      setTimeout(() => this._processQueue(), 100);
    }
  }

  /**
   * Supprime toutes les notifications
   * @param {boolean} includesPersistent - Inclure les notifications persistantes
   */
  clearAll(includesPersistent = false) {
    const toRemove = Array.from(this.notifications.keys()).filter(id => {
      const notification = this.notifications.get(id);
      return includesPersistent || !notification.persistent;
    });

    toRemove.forEach(id => this.removeById(id, 'clear-all'));
  }

  /**
   * Supprime uniquement les notifications non persistantes
   */
  clearNonPersistent() {
    this.clearAll(false);
  }

  /**
   * Retourne le nombre de notifications actives
   * @returns {number} Nombre de notifications
   */
  count() {
    return this.notifications.size;
  }

  /**
   * Retourne le nombre d'éléments en file d'attente
   * @returns {number} Taille de la file d'attente
   */
  queueSize() {
    return this.queue.length;
  }

  /**
   * Vérifie s'il y a des notifications actives
   * @returns {boolean} Vrai s'il y a des notifications
   */
  hasNotifications() {
    return this.notifications.size > 0;
  }

  /**
   * Change la position d'affichage des notifications
   * @param {string} position - Nouvelle position
   */
  setPosition(position) {
    if (!FpemNotif.positions.has(position)) {
      console.warn(`[FPEM NOTIF] Position invalide: ${position}`);
      return;
    }

    this.config.position = position;
    
    // Création du nouveau container si nécessaire
    if (!this._containers.has(position)) {
      const container = this._createContainer(position);
      this._containers.set(position, container);
      document.body.appendChild(container);
    }
  }

  /**
   * Change la durée par défaut des notifications
   * @param {number} duration - Nouvelle durée en millisecondes
   */
  setDefaultDuration(duration) {
    if (typeof duration === 'number' && duration >= 0) {
      this.config.duration = duration;
    }
  }

  /**
   * Active ou désactive le groupement des notifications
   * @param {boolean} enabled - État du groupement
   */
  setGroupSimilar(enabled) {
    this.config.groupSimilar = !!enabled;
  }

  /**
   * Met à jour la configuration du gestionnaire
   * @param {Object} newConfig - Nouvelle configuration
   */
  updateConfig(newConfig) {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    // Validation des nouvelles options
    this._validateOptions();
    
    // Émission d'événement de changement de configuration
    this._emitEvent('config-updated', { oldConfig, newConfig: this.config });
  }

  /**
   * Retourne une copie de la configuration actuelle
   * @returns {Object} Configuration actuelle
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Émet un événement personnalisé
   * @param {string} eventName - Nom de l'événement (sans préfixe)
   * @param {Object} detail - Détails de l'événement
   */
  _emitEvent(eventName, detail = {}) {
    const event = new CustomEvent(`fpemnotif:${eventName}`, {
      detail: {
        ...detail,
        manager: this,
        timestamp: Date.now()
      },
      bubbles: true,
      composed: true
    });

    // Émission sur le container principal s'il existe
    const mainContainer = this._containers.get(this.config.position);
    if (mainContainer) {
      mainContainer.dispatchEvent(event);
    }

    // Émission également sur document pour l'écoute globale
    document.dispatchEvent(event);
  }

  /**
   * Ajoute un listener d'événement pour les notifications
   * @param {string} eventName - Nom de l'événement (sans préfixe fpemnotif:)
   * @param {function} callback - Fonction de callback
   * @returns {function} Fonction de suppression du listener
   */
  on(eventName, callback) {
    const fullEventName = `fpemnotif:${eventName}`;
    document.addEventListener(fullEventName, callback);
    
    // Retourne une fonction pour supprimer le listener
    return () => document.removeEventListener(fullEventName, callback);
  }

  /**
   * Supprime tous les listeners et nettoie les ressources
   */
  destroy() {
    // Suppression de toutes les notifications
    this.clearAll(true);
    
    // Nettoyage des containers
    this._containers.forEach(container => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });
    this._containers.clear();

    // Nettoyage des collections
    this.notifications.clear();
    this.groups.clear();
    this.queue.length = 0;

    // Nettoyage du stockage
    if (this.config.enablePersistence) {
      try {
        localStorage.removeItem(this._persistenceKey);
      } catch (error) {
        console.warn('[FPEM NOTIF] Erreur lors du nettoyage du stockage:', error);
      }
    }

    // Émission d'événement de destruction
    this._emitEvent('destroyed', { manager: this });
  }

  /**
   * Méthode pour créer un builder de notification
   * @param {string} type - Type de notification
   * @returns {FpemNotificationBuilder} Instance du builder
   */
  create(type = 'custom') {
    return new FpemNotificationBuilder(this, type);
  }

  /**
   * Méthode avec mise à jour automatique et progression
   * @param {string} type - Type initial
   * @param {Object} initialOptions - Options initiales
   * @param {Object} updateOptions - Options de mise à jour
   * @param {number} updateDelay - Délai avant mise à jour (ms)
   * @param {number} keepAfterUpdate - Durée après mise à jour (ms)
   * @returns {string} ID de la notification
   */
  notifyWithAutoUpdate(type, initialOptions = {}, updateOptions = {}, updateDelay = 3000, keepAfterUpdate = 3000) {
    // Création de la notification persistante initiale avec progression
    const id = initialOptions.id || this._generateId();
    const notification = this.notify(type, {
      ...initialOptions,
      id,
      persistent: true,
      showProgress: true,
      showCloseButton: false
    });

    if (notification) {
      // Démarrage de l'animation de progression
      notification.startProgressAnimation(updateDelay);

      // Programmation de la mise à jour
      setTimeout(() => {
        this.update(id, {
          ...updateOptions,
          persistent: false,
          duration: keepAfterUpdate,
          showCloseButton: true,
          progress: 100
        });
      }, updateDelay);
    }

    return id;
  }

  /**
   * Met à jour une notification existante
   * @param {string} id - ID de la notification
   * @param {Object} options - Nouvelles options
   * @returns {HTMLElement|null} Notification mise à jour ou null
   */
  update(id, options = {}) {
    return this._updateExistingNotification(id, this._validateAndNormalizeOptions('custom', options));
  }

  /**
   * Affiche une notification avec gestion d'erreur intégrée
   * @param {string} type - Type de notification
   * @param {Object} options - Options de configuration
   * @returns {HTMLElement|null} Notification créée ou null en cas d'erreur
   */
  safeNotify(type, options = {}) {
    try {
      return this.notify(type, options);
    } catch (error) {
      console.error('[FPEM NOTIF] Erreur lors de la création de la notification:', error);
      
      // Tentative de notification d'erreur simplifiée
      try {
        return this.notify('error', {
          title: 'Erreur système',
          message: 'Une erreur est survenue lors de l\'affichage de la notification.',
          persistent: false,
          duration: 5000
        });
      } catch (fallbackError) {
        console.error('[FPEM NOTIF] Erreur critique du système de notification:', fallbackError);
        return null;
      }
    }
  }

  // === MÉTHODES RACCOURCIES POUR LES TYPES COURANTS ===

  /**
   * Affiche une notification de succès
   * @param {Object|string} options - Options ou message direct
   * @returns {HTMLElement} Notification créée
   */
  success(options) {
    if (typeof options === 'string') {
      options = { message: options };
    }
    return this.notify('success', options);
  }

  /**
   * Affiche une notification d'erreur
   * @param {Object|string} options - Options ou message direct
   * @returns {HTMLElement} Notification créée
   */
  error(options) {
    if (typeof options === 'string') {
      options = { message: options };
    }
    return this.notify('error', { duration: 6000, ...options });
  }

  /**
   * Affiche une notification d'avertissement
   * @param {Object|string} options - Options ou message direct
   * @returns {HTMLElement} Notification créée
   */
  warning(options) {
    if (typeof options === 'string') {
      options = { message: options };
    }
    return this.notify('warning', options);
  }

  /**
   * Affiche une notification d'information
   * @param {Object|string} options - Options ou message direct
   * @returns {HTMLElement} Notification créée
   */
  info(options) {
    if (typeof options === 'string') {
      options = { message: options };
    }
    return this.notify('info', options);
  }

  /**
   * Affiche une notification personnalisée
   * @param {Object|string} options - Options ou message direct
   * @returns {HTMLElement} Notification créée
   */
  custom(options) {
    if (typeof options === 'string') {
      options = { message: options };
    }
    return this.notify('custom', options);
  }

  // === MÉTHODES UTILITAIRES AVANCÉES ===

  /**
   * Affiche une notification de chargement avec progression
   * @param {Object} options - Options de configuration
   * @returns {Object} Contrôleur de la notification de chargement
   */
  loading(options = {}) {
    const id = options.id || this._generateId();
    const notification = this.notify('info', {
      ...options,
      id,
      icon: '⏳',
      persistent: true,
      showProgress: true,
      showCloseButton: false,
      title: options.title || 'Chargement...',
      message: options.message || 'Veuillez patienter'
    });

    let currentProgress = 0;

    return {
      notification,
      id,
      
      /**
       * Met à jour le message de chargement
       * @param {string} message - Nouveau message
       */
      updateMessage: (message) => {
        if (this.notifications.has(id)) {
          this.update(id, { message });
        }
      },

      /**
       * Met à jour la progression
       * @param {number} progress - Progression (0-100)
       * @param {string} message - Message optionnel
       */
      updateProgress: (progress, message) => {
        currentProgress = Math.max(0, Math.min(100, progress));
        const updateOptions = { progress: currentProgress };
        
        if (message) updateOptions.message = message;
        
        if (this.notifications.has(id)) {
          this.update(id, updateOptions);
        }
      },

      /**
       * Termine le chargement avec succès
       * @param {string} message - Message de succès
       * @param {number} duration - Durée d'affichage du succès
       */
      success: (message = 'Terminé !', duration = 2000) => {
        if (this.notifications.has(id)) {
          this.update(id, {
            type: 'success',
            icon: '✅',
            title: 'Succès',
            message,
            progress: 100,
            persistent: false,
            duration,
            showCloseButton: true
          });
        }
      },

      /**
       * Termine le chargement avec erreur
       * @param {string} message - Message d'erreur
       * @param {number} duration - Durée d'affichage de l'erreur
       */
      error: (message = 'Une erreur est survenue', duration = 5000) => {
        if (this.notifications.has(id)) {
          this.update(id, {
            type: 'error',
            icon: '❌',
            title: 'Erreur',
            message,
            progress: 0,
            persistent: false,
            duration,
            showCloseButton: true
          });
        }
      },

      /**
       * Annule le chargement
       */
      cancel: () => {
        this.removeById(id, 'cancelled');
      }
    };
  }

  /**
   * Affiche une notification de confirmation avec actions
   * @param {Object} options - Options de configuration
   * @returns {Promise} Promise résolue avec la réponse utilisateur
   */
  confirm(options = {}) {
    return new Promise((resolve) => {
      const id = this._generateId();
      
      const notification = this.notify('warning', {
        ...options,
        id,
        icon: options.icon || '❓',
        persistent: true,
        showCloseButton: false,
        title: options.title || 'Confirmation',
        message: options.message || 'Êtes-vous sûr ?',
        actions: [
          {
            label: options.confirmLabel || 'Confirmer',
            callback: () => {
              this.removeById(id);
              resolve(true);
            },
            primary: true
          },
          {
            label: options.cancelLabel || 'Annuler',
            callback: () => {
              this.removeById(id);
              resolve(false);
            }
          }
        ]
      });

      // Auto-annulation après timeout
      if (options.timeout) {
        setTimeout(() => {
          if (this.notifications.has(id)) {
            this.removeById(id);
            resolve(false);
          }
        }, options.timeout);
      }
    });
  }

  /**
   * Affiche une série de notifications avec délai
   * @param {Array} notifications - Tableau de notifications à afficher
   * @param {number} delay - Délai entre chaque notification (ms)
   * @returns {Promise} Promise résolue quand toutes sont affichées
   */
  sequence(notifications = [], delay = 500) {
    return new Promise((resolve) => {
      let index = 0;
      
      const showNext = () => {
        if (index >= notifications.length) {
          resolve();
          return;
        }

        const notif = notifications[index];
        this.notify(notif.type || 'info', notif.options || {});
        
        index++;
        setTimeout(showNext, delay);
      };

      showNext();
    });
  }

  /**
   * Importe des notifications depuis un fichier JSON
   * @param {string} jsonData - Données JSON des notifications
   * @returns {Array} Notifications importées
   */
  importFromJSON(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      const imported = [];

      if (Array.isArray(data)) {
        data.forEach(notifData => {
          if (notifData.type && (notifData.message || notifData.title)) {
            const notification = this.notify(notifData.type, notifData);
            imported.push(notification);
          }
        });
      }

      return imported;
    } catch (error) {
      console.error('[FPEM NOTIF] Erreur lors de l\'importation:', error);
      return [];
    }
  }

  /**
   * Exporte les notifications actuelles vers JSON
   * @param {boolean} includeTransient - Inclure les notifications temporaires
   * @returns {string} Données JSON des notifications
   */
  exportToJSON(includeTransient = false) {
    const notifications = Array.from(this.notifications.values())
      .filter(notif => includeTransient || notif.persistent)
      .map(notif => ({
        id: notif.dataset.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        icon: notif.icon,
        persistent: notif.persistent,
        timestamp: notif.dataset.timestamp
      }));

    return JSON.stringify(notifications, null, 2);
  }

  /**
   * Retourne des statistiques d'utilisation
   * @returns {Object} Statistiques du gestionnaire
   */
  getStats() {
    const activeNotifications = Array.from(this.notifications.values());
    const byType = {};
    const byPosition = {};

    activeNotifications.forEach(notif => {
      const type = notif.type || 'custom';
      byType[type] = (byType[type] || 0) + 1;

      const container = notif.parentNode;
      if (container && container.dataset.position) {
        const pos = container.dataset.position;
        byPosition[pos] = (byPosition[pos] || 0) + 1;
      }
    });

    return {
      totalActive: this.notifications.size,
      queueSize: this.queue.length,
      groupsCount: this.groups.size,
      byType,
      byPosition,
      config: this.getConfig(),
      containers: Array.from(this._containers.keys())
    };
  }
}

// === ENREGISTREMENT DES COMPOSANTS ===

/**
 * Enregistre le composant Web FpemNotification si pas déjà fait
 * Évite les erreurs de double enregistrement
 */
if (!customElements.get('fpem-notification')) {
  customElements.define('fpem-notification', FpemNotification);
}

// === INSTANCE GLOBALE PAR DÉFAUT ===

/**
 * Instance globale par défaut pour un usage immédiat
 * Accessible via window.fpemNotif
 */
if (typeof window !== 'undefined') {
  // Création de l'instance globale
  window.FpemNotif = FpemNotif;
  window.FpemNotificationBuilder = FpemNotificationBuilder;
  
  // Instance par défaut prête à l'emploi
  window.fpemNotif = new FpemNotif();

  // Alias pour compatibilité et facilité d'usage
  window.notify = window.fpemNotif.notify.bind(window.fpemNotif);
  window.notifySuccess = window.fpemNotif.success.bind(window.fpemNotif);
  window.notifyError = window.fpemNotif.error.bind(window.fpemNotif);
  window.notifyWarning = window.fpemNotif.warning.bind(window.fpemNotif);
  window.notifyInfo = window.fpemNotif.info.bind(window.fpemNotif);
}

// === SUPPORT MODULE ES6 ===

/**
 * Export pour utilisation en tant que module ES6
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FpemNotif,
    FpemNotificationBuilder,
    FpemNotification
  };
}

/**
 * ========================================================================
 * EXEMPLES D'UTILISATION
 * ========================================================================
 * 
 * // Utilisation basique
 * fpemNotif.success('Opération réussie !');
 * fpemNotif.error({ title: 'Erreur', message: 'Quelque chose s\'est mal passé' });
 * 
 * // Utilisation du builder pattern
 * fpemNotif.create('info')
 *   .title('Information importante')
 *   .message('Ceci est un message d\'information')
 *   .icon('ℹ️')
 *   .duration(5000)
 *   .closable(true)
 *   .action('Voir plus', () => console.log('Action déclenchée'))
 *   .show();
 * 
 * // Notification avec progression
 * const loader = fpemNotif.loading({
 *   title: 'Téléchargement en cours',
 *   message: 'Veuillez patienter...'
 * });
 * 
 * loader.updateProgress(50, 'Progression: 50%');
 * loader.success('Téléchargement terminé !');
 * 
 * // Confirmation avec Promise
 * fpemNotif.confirm({
 *   title: 'Supprimer l\'élément',
 *   message: 'Cette action est irréversible',
 *   confirmLabel: 'Supprimer',
 *   cancelLabel: 'Annuler'
 * }).then(confirmed => {
 *   if (confirmed) {
 *     console.log('Élément supprimé');
 *   }
 * });
 * 
 * // Configuration personnalisée
 * const customNotifier = new FpemNotif({
 *   position: 'top-center',
 *   duration: 6000,
 *   maxVisible: 3,
 *   enableSounds: true,
 *   theme: 'dark'
 * });
 * 
 * // Écoute d'événements
 * fpemNotif.on('added', (event) => {
 *   console.log('Notification ajoutée:', event.detail);
 * });
 * 
 * ========================================================================
 */
