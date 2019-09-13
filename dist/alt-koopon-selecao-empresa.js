;(function(ng) {
  "use strict";

  ng.module('alt.koopon.selecao-empresa', [
      'ngResource',
      'alt.passaporte-usuario-logado',
      'alt.alerta-flutuante',
      'alt.modal-service',
      'alt.passaporte-procuracao',
      'alt.alerta-flutuante',
      'alt.carregando-info'
    ])
    .config(['$httpProvider', function($httpProvider) {
      $httpProvider.interceptors.push('AltKooponEmpresaNaoSelecionadaInterceptor');
    }])
    .constant('ID_STATUS_BIMER_PLENO_ATENDIMENTO', '0010000001')
    .constant('ID_MODAL_EMPRESA_INADIMPLENCIA', '#alt-koopon-selecao-empresa-modal-inadimplencia')
    .constant('ID_MODAL_EMPRESA_DEMONSTRACAO_EXPIRADA', '#alt-koopon-selecao-empresa-modal-demonstracao-expirada')
    .constant('AltKooponEventoEmpresa', {
      EVENTO_EMPRESA_ESCOLHIDA: 'alt.koopon.empresa-escolhida',
      EVENTO_EMPRESA_NAO_CONFIGURADA: 'alt.koopon.empresa-nao-configurada'
    })
    .constant('AltKooponMotivoAcessoNegado', {
      PENDENCIAS_ADMINISTRATIVAS: 'PENDENCIAS_ADMINISTRATIVAS',
      DEMONSTRACAO_EXPIRADA: 'DEMONSTRACAO_EXPIRADA',
    })
    .provider('AltKooponSelecaoEmpresaPassaporteUrlBase', [function() {
      this.url = '';

      this.$get = [function() {
        return this.url;
      }];
    }])
    .provider('AltKooponSelecaoEmpresaChaveProduto', [function() {
      this.chave = '';

      this.$get = [function() {
        return this.chave;
      }];
    }])
    .provider('AltKooponSelecaoEmpresaCheckoutUrl', [function() {
      this.url = '';

      this.$get = [function() {
        return this.url;
      }];
    }])
    .factory('AltKooponEmpresaNaoSelecionadaInterceptor', ['$rootScope', '$q', '$location', 'AltKooponEventoEmpresa', function ($rootScope, $q, $location, AltKooponEventoEmpresa) {
      return {
        responseError: function(rej) {
          var _deveSelecionarEmpresa = (!!rej) && (rej.status === 403) && (!!rej.data) && (rej.data.deveSelecionarEmpresa);
          var _wizardUrl = !!~$location.path().indexOf('wizard');

          if (_deveSelecionarEmpresa && !_wizardUrl) {
            $rootScope.$broadcast(AltKooponEventoEmpresa.EVENTO_EMPRESA_NAO_CONFIGURADA);
            $location.path('/selecao-empresas');
          }

          return $q.reject(rej);
        }
      };
    }])
    .provider('AltKoopon_BASE_API', function() {
      this.url = '/koopon-rest-api/';

      this.$get = function() {
        return this.url;
      }
    })
    .factory('AltKooponEmpresaResource', ['$resource', 'AltKoopon_BASE_API', function($resource, AltKoopon_BASE_API) {
      var _url = AltKoopon_BASE_API + 'assinantes/selecao';
      var _params = {};
      var _methods = {
        escolhe: {
          method: "POST",
          isArray: false
        }
      };

      return $resource(_url, _params, _methods);
    }])
    .factory('AltKooponEmpresaService', ['$rootScope', '$http', '$q', '$xtorage', 'AltPassaporteUsuarioLogadoManager', 'AltKooponEmpresaResource', 'AltKooponEventoEmpresa', 'AltKooponSelecaoEmpresaPassaporteUrlBase', 'AltKooponSelecaoEmpresaChaveProduto',
      function($rootScope, $http, $q, $xtorage, AltPassaporteUsuarioLogadoManager, AltKooponEmpresaResource, AltKooponEventoEmpresa, AltKooponSelecaoEmpresaPassaporteUrlBase, AltKooponSelecaoEmpresaChaveProduto) {

        var CHAVE_STORAGE_EMPRESA_ESCOLHIDA = 'emp_escolhida';

        var AltKooponEmpresaService = function() {};

        AltKooponEmpresaService.prototype.getEmpresas = function(nomeProp) {
          var _nomeProp = nomeProp || 'assinantes';

          return AltPassaporteUsuarioLogadoManager.retorna()[_nomeProp];
        };

        AltKooponEmpresaService.prototype.salvaNaStorageEmpresaEscolhida = function(empresa, chave) {
          var _chave = chave || CHAVE_STORAGE_EMPRESA_ESCOLHIDA;

          $xtorage.save(_chave, empresa);
        };

        AltKooponEmpresaService.prototype.getEmpresaEscolhidaDaStorage = function(chave) {
          var _chave = chave || CHAVE_STORAGE_EMPRESA_ESCOLHIDA;

          return $xtorage.get(_chave);
        };

        AltKooponEmpresaService.prototype.escolhe = function(empresa) {
          if (angular.isUndefined(empresa) || !angular.isObject(empresa) || angular.isUndefined(empresa.id)) {
            return $q.reject(new TypeError('Empresa deve ser informada para ser passada ao servidor.'));
          }

          return AltKooponEmpresaResource
            .escolhe({empresaEscolhida: empresa.id})
            .$promise
            .then(function(infoUsuario) {
              $rootScope.$broadcast(AltKooponEventoEmpresa.EVENTO_EMPRESA_ESCOLHIDA, infoUsuario.assinantes[0]);
              return infoUsuario.assinantes[0];
            });
        };

        return new AltKooponEmpresaService();
      }])
    .service('AltKooponSelecaoEmpresasHelper', ['$location', 'AltKooponEmpresaService', function($location, AltKooponEmpresaService) {
      this.escolheEmpresaSemProcuracao = function(empresa) {
        return AltKooponEmpresaService
          .escolhe(empresa)
          .then(function(empVindaDoPassaporte) {
            AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida(empVindaDoPassaporte);
            $location.path('/');
          });
      };
    }])
    .controller('AltKooponSelecaoEmpresasController', [
      'AltKooponSelecaoEmpresasHelper',
      'AltKooponEmpresaService',
      'AltAlertaFlutuanteService',
      'AltCarregandoInfoService',
      'AltModalService',
      'AltKooponMotivoAcessoNegado',
      'ID_MODAL_EMPRESA_INADIMPLENCIA',
      'ID_MODAL_EMPRESA_DEMONSTRACAO_EXPIRADA',
      function(AltKooponSelecaoEmpresasHelper, AltKooponEmpresaService, AltAlertaFlutuanteService, AltCarregandoInfoService, AltModalService, AltKooponMotivoAcessoNegado, ID_MODAL_EMPRESA_INADIMPLENCIA, ID_MODAL_EMPRESA_DEMONSTRACAO_EXPIRADA) {
        var self = this;

        self.empresas = [];

        self.escolheEmpresa = function(empresa) {
          AltCarregandoInfoService.exibe();

          return AltKooponSelecaoEmpresasHelper
            .escolheEmpresaSemProcuracao(empresa)
            .catch(function(erro) {
              console.log('=>', erro);
              if (erro.status === 403) {
                if (erro.mensagem === AltKooponMotivoAcessoNegado.DEMONSTRACAO_EXPIRADA || (
                    !!erro.data && erro.data.mensagem === AltKooponMotivoAcessoNegado.DEMONSTRACAO_EXPIRADA)) {
                  AltModalService.open(ID_MODAL_EMPRESA_DEMONSTRACAO_EXPIRADA);
                }
                else {
                  AltModalService.open(ID_MODAL_EMPRESA_INADIMPLENCIA);
                }
              }
              else {
                AltAlertaFlutuanteService.exibe({msg: erro.mensagem});
              }
            })
            .finally(function() {
              AltCarregandoInfoService.esconde();
            });
        };

        self.init = function(emp) {
          self.empresas = AltKooponEmpresaService.getEmpresas(emp) || self.empresas;

          if (self.empresas.length === 1) {
            self.escolheEmpresa(self.empresas[0]);
          }
        };
      }])
    .controller('AltEmpresaEscolhidaController', ['$rootScope', '$scope', 'AltKooponEmpresaService', function($rootScope, $scope, AltKooponEmpresaService) {
        // Esta controller deve ser utilizada em cada rota, já que não houve mudanças de rota
        // e coisas do tipo;

        var self = this;

        self.empresaEscolhida = AltKooponEmpresaService.getEmpresaEscolhidaDaStorage();

        $scope.$on('$destroy', function() {
            self.empresaEscolhida = null;
        });
    }]);
}(window.angular));
