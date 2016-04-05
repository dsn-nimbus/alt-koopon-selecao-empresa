;(function(ng) {
  "use strict";

  ng.module('alt.koopon.selecao-empresa', [
      'ngResource',
      'alt.passaporte-usuario-logado',
      'alt.alerta-flutuante',
      'alt.passaporte-procuracao',
      'alt.alerta-flutuante',
      'alt.carregando-info'
    ])
    .config(['$httpProvider', function($httpProvider) {
      $httpProvider.interceptors.push('AltKooponEmpresaNaoSelecionadaInterceptor');
    }])
    .constant('_', _)
    .constant('ID_KOOPON_EMPRESA', '60f1fe1f835b14a3d20ac0f046fac668')
    .constant('ID_KOOPON_CONTADOR', '3c59dc048e8850243be8079a5c74d079')
    .constant('AltKooponEventoEmpresa', {
      EVENTO_EMPRESA_ESCOLHIDA: 'empresa-escolhida',
      EVENTO_EMPRESA_NAO_CONFIGURADA: 'empresa-nao-configurada'
    })
    .factory('AltKooponEmpresaNaoSelecionadaInterceptor', ['$rootScope', '$q', '$location', 'AltKooponEventoEmpresa', function ($rootScope, $q, $location, AltKooponEventoEmpresa) {
      return {
        responseError: function(rej) {
          var _deveSelecionarEmpresa = (!!rej) && (rej.status === 403) && (!!rej.data) && (rej.data.deveSelecionarEmpresa);
          var _wizardUrl = !!~$location.path().indexOf('wizard');

          $rootScope.$broadcast(AltKooponEventoEmpresa.EVENTO_EMPRESA_NAO_CONFIGURADA);

          if (_deveSelecionarEmpresa && !_wizardUrl) {
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
              $rootScope.$broadcast(AltKooponEventoEmpresa.EVENTO_EMPRESA_ESCOLHIDA);
              return empresaEscolhida;
            })
            .catch(function(erro) {
              return $q.reject(erro);
            });
        };

        return new AltKooponEmpresaService();
      }])
    .service('AltKooponSelecaoEmpresasHelper', ['$location', 'AltKooponEmpresaService', 'AltPassaporteUsuarioLogadoManager', 'AltPassaporteProcuracaoService', '_', 'ID_KOOPON_EMPRESA', 'ID_KOOPON_CONTADOR', function($location, AltKooponEmpresaService, AltPassaporteUsuarioLogadoManager, AltPassaporteProcuracaoService, _, ID_KOOPON_EMPRESA, ID_KOOPON_CONTADOR) {
      this.escolheEmpresaComProcuracao = function(empresa) {
        return AltKooponEmpresaService
          .escolhe(empresa)
          .then(function() {
            return AltPassaporteProcuracaoService
              .getInfo(empresa.id, ID_KOOPON_CONTADOR, ID_KOOPON_EMPRESA)
              .then(function(usuario) {
                var _usuario = angular.copy(usuario);

                _usuario.assinantesEmpresa = usuario.assinantes || [];
                _usuario.assinantes.length = 0;

                var _usuarioStorage = AltPassaporteUsuarioLogadoManager.retorna();

                if (ng.isArray(_usuarioStorage.assinantes)) {
                  _usuarioStorage.assinantes.length = 0;
                }

                if (ng.isArray(_usuarioStorage.assinantesEmpresa)) {
                  _usuarioStorage.assinantesEmpresa.length = 0;
                }

                var _usuarioMerge = _.merge(_usuario, _usuarioStorage);

                AltPassaporteUsuarioLogadoManager.atualiza(_usuarioMerge);
                AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida(empresa);

                $location.path('/');
              });
          })
      };

      this.escolheEmpresaSemProcuracao = function(empresa) {
        return AltKooponEmpresaService
          .escolhe(empresa)
          .then(function() {
            $location.path('/');
            AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida(empresa);
          });
      };
    }])
    .controller('AltKooponSelecaoEmpresasController', ['AltKooponSelecaoEmpresasHelper', 'AltKooponEmpresaService', 'AltAlertaFlutuanteService', 'AltCarregandoInfoService', '_',
      function(AltKooponSelecaoEmpresasHelper, AltKooponEmpresaService, AltAlertaFlutuanteService, AltCarregandoInfoService, _) {
        var self = this;

        self.empresas = [];

        self._escolheEmpresa = function(empresa) {
          AltCarregandoInfoService.exibe();

          AltKooponSelecaoEmpresasHelper
            .escolheEmpresaSemProcuracao(empresa)
            .catch(function(erro) {
              AltAlertaFlutuanteService.exibe({msg: erro.mensagem});
            })
            .finally(function() {
              AltCarregandoInfoService.esconde();
            });
        };

        self._escolheEmpresaComProcuracao = function(empresa) {
          AltCarregandoInfoService.exibe();

          AltKooponSelecaoEmpresasHelper
            .escolheEmpresaComProcuracao(empresa)
            .catch(function(erro) {
              AltAlertaFlutuanteService.exibe({msg: erro.mensagem});
            })
            .finally(function() {
              AltCarregandoInfoService.esconde();
            });
        };

        self.escolheEmpresa = function(empresa, comProcuracao) {
          if (comProcuracao) {
            self._escolheEmpresaComProcuracao(empresa);
          }
          else {
            self._escolheEmpresa(empresa);
          }
        };

        self.init = function(emp, comProcuracao) {
          self.empresas = AltKooponEmpresaService.getEmpresas(emp) || self.empresas;

          if (self.empresas.length === 1) {
            self._escolheEmpresa(self.empresas[0], comProcuracao);
          }
        };

        self.initComProcuracao = function(emp) {
          self.init(emp, true);
        };
      }]);
}(window.angular));
