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
    .constant('ID_MODAL_EMPRESA_SEM_PERMISSAO_ACESSO', '#alt-koopon-selecao-empresa-modal-inadimplencia')
    .constant('AltKooponEventoEmpresa', {
      EVENTO_EMPRESA_ESCOLHIDA: 'alt.koopon.empresa-escolhida',
      EVENTO_EMPRESA_NAO_CONFIGURADA: 'alt.koopon.empresa-nao-configurada'
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
    .factory('AltPassaportePublicoResource', [
      '$resource',
      'AltKooponSelecaoEmpresaPassaporteUrlBase',
      'AltKooponSelecaoEmpresaChaveProduto',
      function($resource, passaporteBaseUrl, chaveProduto) {
        var _url = passaporteBaseUrl + 'assinantes/:idExterno/produtos/' + chaveProduto;
        var _params = {};
        var _methods = {
          dadosAssinanteProduto: {
            method: "GET"
          }
        };

        return $resource(_url, _params, _methods);
      }
    ])
    .factory('AltKooponPermissaoAssinanteService', [
      '$http',
      '$location',
      '$log',
      'AltPassaportePublicoResource',
      'ID_STATUS_BIMER_PLENO_ATENDIMENTO',
      function($http, $location, $log, passaportePublicoResource, ID_STATUS_PLENO) {

      var _buscaInformacoesAdministrativasAssinanteKoopon = function(idExternoEmpresa) {
        return passaportePublicoResource.query({
          idExterno: idExternoEmpresa
        })
        .$promise
        .then(function(resp) {
          return resp[0];
        })
        .catch(function() {
          $log.error('Falha ao obter dados administrativos do assinante ' + idExternoEmpresa + ' para o produto.');
          return null;
        });
      };

      var _temPermissaoAcesso = function(idExternoEmpresa) {
        return _buscaInformacoesAdministrativasAssinanteKoopon(idExternoEmpresa)
        .then(function(dadosAssinante) {
          if (!dadosAssinante) {
            return false;
          }
          return dadosAssinante.idStatusCrm == ID_STATUS_PLENO && !dadosAssinante.inadimplenteCrm;
        });
      };

      return {
        temPermissaoAcesso: _temPermissaoAcesso
      };
    }])
    .factory('AltKooponEmpresaService', ['$rootScope','$q', '$xtorage', 'AltPassaporteUsuarioLogadoManager', 'AltKooponEmpresaResource', 'AltKooponEventoEmpresa',
      function($rootScope, $q, $xtorage, AltPassaporteUsuarioLogadoManager, AltKooponEmpresaResource, AltKooponEventoEmpresa) {

        var CHAVE_STORAGE_EMPRESA_ESCOLHIDA = 'emp_escolhida';

        var AltKooponEmpresaService = function() {

        };

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
            .then(function(empresaEscolhida) {
              $rootScope.$broadcast(AltKooponEventoEmpresa.EVENTO_EMPRESA_ESCOLHIDA, empresa);
              return empresaEscolhida;
            })
            .catch(function(erro) {
              return $q.reject(erro);
            });
        };

        return new AltKooponEmpresaService();
      }])
    .service('AltKooponSelecaoEmpresasHelper', ['$location', 'AltKooponEmpresaService', function($location, AltKooponEmpresaService) {
      this.escolheEmpresaSemProcuracao = function(empresa) {
        return AltKooponEmpresaService
          .escolhe(empresa)
          .then(function() {
            AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida(empresa);
            $location.path('/');
          });
      };
    }])
    .controller('AltKooponSelecaoEmpresasController', [
      'AltKooponSelecaoEmpresasHelper',
      'AltKooponPermissaoAssinanteService',
      'AltKooponEmpresaService',
      'AltAlertaFlutuanteService',
      'AltCarregandoInfoService',
      'AltModalService',
      'ID_MODAL_EMPRESA_SEM_PERMISSAO_ACESSO',
      function(AltKooponSelecaoEmpresasHelper, AltKooponPermissaoAssinanteService, AltKooponEmpresaService, AltAlertaFlutuanteService, AltCarregandoInfoService, AltModalService, ID_MODAL_EMPRESA_SEM_PERMISSAO_ACESSO) {
        var self = this;

        self.empresas = [];

        self.escolheEmpresa = function(empresa) {
          AltCarregandoInfoService.exibe();

          AltKooponPermissaoAssinanteService.temPermissaoAcesso(empresa.idExterno)
          .then(function(temPermissao) {

            if (temPermissao) {
              return AltKooponSelecaoEmpresasHelper
                .escolheEmpresaSemProcuracao(empresa)
                .catch(function(erro) {
                  AltAlertaFlutuanteService.exibe({msg: erro.mensagem});
                })
                .finally(function() {
                  AltCarregandoInfoService.esconde();
                });
            }
            else {
              AltCarregandoInfoService.esconde();
              AltModalService.open(ID_MODAL_EMPRESA_SEM_PERMISSAO_ACESSO, {
                backdrop: 'static'
              });
            }
          })
        };

        self.init = function(emp) {
          self.empresas = AltKooponEmpresaService.getEmpresas(emp) || self.empresas;

          if (self.empresas.length === 1) {
            self.escolheEmpresa(self.empresas[0]);
          }
        };
      }])
    .controller('AltEmpresaEscolhidaController', ['$rootScope', '$scope', 'AltKooponEmpresaService', function($rootScope, $scope, AltKooponEmpresaService) {
        // Esta controller deve ser utilizada em cada rota, já que não ouve mudanças de rota
        // e coisas do tipo;

        var self = this;

        self.empresaEscolhida = AltKooponEmpresaService.getEmpresaEscolhidaDaStorage();

        $scope.$on('$destroy', function() {
            self.empresaEscolhida = null;
        });
    }]);
}(window.angular));
