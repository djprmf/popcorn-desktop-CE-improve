(function (App) {
    'use strict';

    var STREAM_PORT = 21584; // 'PT'!
    var BUFFERING_SIZE = 10 * 1024 * 1024;

    var readTorrent = require('read-torrent');
    var peerflix = require('peerflix');
    var path = require('path');
    var crypto = require('crypto');

    var engine = null;
    var preload_engine = null;
    var statsUpdater = null;
    var active = function (wire) {
        return !wire.peerChoking;
    };
    var subtitles = null;
    var hasSubtitles = false;
    var downloadedSubtitles = false;
    var subtitleDownloading = false;


    var watchState = function (stateModel) {


        if (engine != null) {

            var swarm = engine.swarm;
            var state = 'connecting';

            if ((swarm.downloaded > BUFFERING_SIZE || (swarm.piecesGot * (engine.torrent !== null ? engine.torrent.pieceLength : 0)) > BUFFERING_SIZE)) {
                state = 'ready';
            } else if (swarm.downloaded || swarm.piecesGot > 0) {
                state = 'downloading';
            } else if (swarm.wires.length) {
                state = 'startingDownload';
            }
            if (state === 'ready' && (!hasSubtitles || (hasSubtitles && !downloadedSubtitles))) {
                state = 'waitingForSubtitles';
            }

            stateModel.set('state', state);

            if (state !== 'ready') {
                _.delay(watchState, 100, stateModel);
            }

            // This is way too big, should be fixed but basically
            // We only download subtitle once file is ready (to get path)
            // and when the selected lang or default lang is set
            // subtitleDownloading is needed cos this is called every 300ms

            if (stateModel.get('streamInfo').get('torrent').defaultSubtitle && stateModel.get('streamInfo').get('torrent').defaultSubtitle !== 'none' && hasSubtitles && subtitles != null && engine.files[0] && !downloadedSubtitles && !subtitleDownloading) {
                subtitleDownloading = true;
                App.vent.trigger('subtitle:download', {
                    url: subtitles[stateModel.get('streamInfo').get('torrent').defaultSubtitle],
                    path: path.join(engine.path, engine.files[0].path)
                });
            }

            // No need to download subtitles
            if (!stateModel.get('streamInfo').get('torrent').defaultSubtitle || stateModel.get('streamInfo').get('torrent').defaultSubtitle === 'none') {
                downloadedSubtitles = true;
            }
        }
    };

    var handleTorrent = function (torrent, stateModel) {

        var tmpFilename = torrent.info.infoHash;
        tmpFilename = tmpFilename.replace(/([^a-zA-Z0-9-_])/g, '_'); // +'-'+ (new Date()*1);
        var tmpFile = path.join(App.settings.tmpLocation, tmpFilename);
        subtitles = torrent.subtitle;

        var torrentPeerId = crypto.pseudoRandomBytes(10).toString('hex');

        win.debug('Streaming movie to %s', tmpFile);

        engine = peerflix(torrent.info, {
            connections: parseInt(Settings.connectionLimit, 10) || 100, // Max amount of peers to be connected to.
            dht: true || 50,
            tracker: true,
            trackers: [
                'udp://tracker.openbittorrent.com:80',
                'udp://tracker.coppersurfer.tk:6969',
                'udp://open.demonii.com:1337',
                // more added by DJPRMF
				'udp://tracker.blackunicorn.xyz:6969/announce',
				'udp://castradio.net:6969/announce',
				'http://castradio.net:6969/announce',
				'udp://open.demonii.com:1337/announce',
				'udp://open.demonii.com:6969/announce',
				'http://open.demonii.com:1337/announce',
				'http://open.demonii.com:6969/announce',
				'udp://exodus.desync.com:80/announce',
				'udp://exodus.desync.com:6969/announce',
				'udp://tracker.glotorrents.com:6969/announce',
				'http://tracker.glotorrents.com:6969/announce',
				'udp://tracker.glotorrents.pw:6969/announce',
				'http://tracker.glotorrents.pw:6969/announce',
				'udp://tracker.leechers-paradise.org:80/announce',
				'udp://tracker.leechers-paradise.org:6969/announce',
				'http://tracker.leechers-paradise.org:80/announce',
				'http://tracker.leechers-paradise.org:6969/announce',
				'udp://tracker.openbittorrent.com:80/announce',
				'udp://tracker.openbittorrent.com:6969/announce',
				'http://tracker.openbittorrent.com:80/announce',
				'http://tracker.openbittorrent.com:6969/announce',
				'udp://tracker.publicbt.com:80/announce',
				'udp://tracker.publicbt.com:6969/announce',
				'http://tracker.publicbt.com:80/announce',
				'http://tracker.publicbt.com:6969/announce',
				'udp://tracker.x4w.co:6969/announce',
				'http://tracker.x4w.co:6969/announce',
				'udp://open.acgtracker.com:1096/announce',
				'udp://tracker.aletorrenty.pl:2710/announce',
				'http://tracker.aletorrenty.pl:2710/announce',
				'udp://anisaishuu.de:2710/announce',
				'http://anisaishuu.de:2710/announce',
				'udp://p4p.arenabg.com:1337/announce',
				'http://p4p.arenabg.com:1337/announce',
				'udp://tracker.dutchtracking.com:80/announce',
				'http://tracker.dutchtracking.com:80/announce',
				'udp://tracker.dutchtracking.nl:80/announce',
				'http://tracker.dutchtracking.nl:80/announce',
				'udp://tracker.ex.ua:80/announce',
				'http://tracker.ex.ua:80/announce',
				'udp://explodie.org:6969/announce',
				'udp://torrent.gresille.org:80/announce',
				'http://torrent.gresille.org:80/announce',
				'udp://tracker.kicks-ass.net:80/announce',
				'http://tracker.kicks-ass.net:80/announce',
				'udp://retracker.krs-ix.ru:80/announce',
				'http://retracker.krs-ix.ru:80/announce',
				'udp://megapeer.org:6969/announce',
				'http://megapeer.org:6969/announce',
				'udp://mgtracker.org:2710/announce',
				'http://mgtracker.org:2710/announce',
				'udp://tracker.ohys.net:80/announce',
				'http://tracker.ohys.net:80/announce',
				'udp://tracker.opentrackr.org:1337/announce',
				'http://tracker.opentrackr.org:1337/announce',
				'udp://tracker4.piratux.com:6969/announce',
				'http://tracker4.piratux.com:6969/announce',
				'udp://tracker.pubt.net:2710/announce',
				'http://tracker.pubt.net:2710/announce',
				'udp://pubt.net:2710/announce',
				'http://pubt.net:2710/announce',
				'udp://9.rarbg.com:80/announce',
				'udp://9.rarbg.com:2710/announce',
				'udp://tracker.skyts.net:6969/announce',
				'http://tracker.skyts.net:6969/announce',
				'udp://retracker.telecom.kz:80/announce',
				'http://retracker.telecom.kz:80/announce',
				'udp://tracker.tiny-vps.com:6969/announce',
				'http://tracker.tiny-vps.com:6969/announce',
				'udp://tracker2.torrentino.com:80/announce',
				'http://tracker2.torrentino.com:80/announce',
				'udp://torrentsmd.com:6969/announce',
				'udp://torrentsmd.com:8080/announce',
				'http://torrentsmd.com:6969/announce',
				'http://torrentsmd.com:8080/announce',
				'udp://tracker.tricitytorrents.com:2710/announce',
				'http://tracker.tricitytorrents.com:2710/announce',
				'udp://www.wareztorrent.com:80/announce',
				'udp://www.wareztorrent.com:6969/announce',
				'http://www.wareztorrent.com:80/announce',
				'http://www.wareztorrent.com:6969/announce',
				'udp://tracker4.infohash.org:80/announce',
				'udp://tracker4.infohash.org:6969/announce',
				'http://tracker4.infohash.org:80/announce',
				'http://tracker4.infohash.org:6969/announce',
				'udp://91.218.230.81:80/announce',
				'udp://91.218.230.81:6969/announce',
				'http://91.218.230.81:80/announce',
				'http://91.218.230.81:6969/announce',
				'udp://bttrack.9you.com:80/announce',
				'http://bttrack.9you.com:80/announce',
				'udp://tracker.anime-miako.to:6969/announce',
				'http://tracker.anime-miako.to:6969/announce',
				'udp://i.bandito.org:80/announce',
				'udp://bandito.org:80/announce',
				'udp://tracker.best-torrents.net:6969/announce',
				'http://tracker.best-torrents.net:6969/announce',
				'udp://bigtorrent.org:2710/announce',
				'udp://tracker.bitreactor.to:2710/announce',
				'udp://tracker.btzoo.eu:80/announce',
				'udp://bulkpeers.com:2710/announce',
				'udp://bt.careland.com.cn:6969/announce',
				'http://bt.careland.com.cn:6969/announce',
				'udp://tracker.ccc.de:80/announce',
				'http://tracker.ccc.de:80/announce',
				'udp://cpleft.com:2710/announce',
				'http://cpleft.com:2710/announce',
				'udp://craiovatracker.com:80/announce',
				'http://craiovatracker.com:80/announce',
				'udp://inferno.demonoid.ooo:3389/announce',
				'udp://inferno.demonoid.ooo:3392/announce',
				'udp://inferno.demonoid.ooo:3399/announce',
				'udp://inferno.demonoid.ooo:3405/announce',
				'udp://inferno.demonoid.ooo:3406/announce',
				'udp://inferno.demonoid.ooo:3407/announce',
				'udp://inferno.demonoid.ooo:3414/announce',
				'http://inferno.demonoid.ooo:3392/announce',
				'http://inferno.demonoid.ooo:3399/announce',
				'udp://dendox.org:1471/announce',
				'udp://divxhunt.me:80/announce',
				'http://divxhunt.me:80/announce',
				'udp://tracker.dler.org:6969/announce',
				'udp://bt.e-burg.org:2710/announce',
				'udp://www.elitezones.ro:80/announce',
				'http://www.elitezones.ro:80/announce',
				'udp://elitezones.ro:80/announce',
				'http://elitezones.ro:80/announce',
				'udp://retracker.nn.ertelecom.ru:80/announce',
				'udp://tracker.flashtorrents.org:80/announce',
				'http://tracker.flashtorrents.org:80/announce',
				'udp://tracker.gaytorrent.ru:80/announce',
				'http://tracker.gaytorrent.ru:80/announce',
				'udp://grabthe.info:80/announce',
				'http://grabthe.info:80/announce',
				'udp://tracker.hdcmct.com:2710/announce',
				'http://tracker.hdcmct.com:2710/announce',
				'udp://tracker.hdreactor.org:2710/announce',
				'http://tracker.hdreactor.org:2710/announce',
				'udp://bt.home-ix.ru:80/announce',
				'udp://torrent.jiwang.cc:80/announce',
				'http://torrent.jiwang.cc:80/announce',
				'udp://retracker.kld.ru:80/announce',
				'udp://retracker.kld.ru:2710/announce',
				'udp://kubanmedia.org:2710/announce',
				'http://kubanmedia.org:2710/announce',
				'udp://tracker.marshyonline.net:80/announce',
				'http://tracker.marshyonline.net:80/announce',
				'udp://masters-tb.com:80/announce',
				'http://masters-tb.com:80/announce',
				'udp://tracker.minglong.org:8080/announce',
				'http://tracker.minglong.org:8080/announce',
				'udp://www.music-vid.com:80/announce',
				'http://www.music-vid.com:80/announce',
				'udp://www.mvgroup.org:2710/announce',
				'http://www.mvgroup.org:2710/announce',
				'udp://tracker.novalayer.org:6969/announce',
				'udp://open.nyaatorrents.info:6544/announce',
				'http://open.nyaatorrents.info:6544/announce',
				'udp://announce.opensharing.org:2710/announce',
				'http://announce.opensharing.org:2710/announce',
				'udp://opensharing.org:2710/announce',
				'http://opensharing.org:2710/announce',
				'udp://pornograd.net:80/announce',
				'http://pornograd.net:80/announce',
				'udp://rds-zone.ro:80/announce',
				'http://rds-zone.ro:80/announce',
				'udp://bt.rutor.org:2710/announce',
				'http://bt.rutor.org:2710/announce',
				'udp://tracker.seedceo.com:2710/announce',
				'udp://tracker.seedceo.vn:2710/announce',
				'udp://siambit.com:80/announce',
				'http://siambit.com:80/announce',
				'udp://torrent-downloads.to:5869/announce',
				'http://torrent-downloads.to:5869/announce',
				'udp://torrent-tracker.ru:80/announce',
				'http://torrent-tracker.ru:80/announce',
				'udp://tracker.torrentbay.to:6969/announce',
				'udp://tracker.torrentfrancais.com:80/announce',
				'http://tracker.torrentfrancais.com:80/announce',
				'udp://tracker.torrentparty.com:6969/announce',
				'udp://tracker.torrenty.org:6969/announce',
				'udp://tracker.trackerfix.com:80/announce',
				'http://tracker.trackerfix.com:80/announce',
				'udp://traht.org:80/announce',
				'http://traht.org:80/announce',
				'udp://unhide-torrents.org:80/announce',
				'http://unhide-torrents.org:80/announce',
				'udp://trackeropenbittorrent.uni.me:80/announce',
				'http://trackeropenbittorrent.uni.me:80/announce',
				'udp://www.unlimitz.com:80/announce',
				'http://www.unlimitz.com:80/announce',
				'udp://papaja.v2v.cc:6970/announce',
				'http://papaja.v2v.cc:6970/announce',
				'udp://tracker1.wasabii.com.tw:6969/announce',
				'udp://tracker.windsormetalbattery.com:80/announce',
				'http://tracker.windsormetalbattery.com:80/announce',
				'udp://tracker.yify-torrents.com:80/announce',
				'http://tracker.yify-torrents.com:80/announce',
				'udp://91.121.54.8:80/announce',
				'udp://91.121.54.8:6969/announce',
				'http://91.121.54.8:80/announce',
				'http://91.121.54.8:6969/announce',
				'udp://94.228.192.98:80/announce',
				'udp://94.228.192.98:6969/announce',
				'http://94.228.192.98:6969/announce',
				'udp://122.179.83.96:31299/announce',
				'udp://121.14.98.151:80/announce',
				'udp://121.14.98.151:9090/announce',
				'udp://193.107.16.156:80/announce',
				'udp://193.107.16.156:2710/announce',
				'http://193.107.16.156:80/announce',
				'http://193.107.16.156:2710/announce',
				'udp://208.67.16.113:80/announce',
				'udp://208.67.16.113:6969/announce'
            ],
            port: parseInt(Settings.streamPort, 10) || 0,
            tmp: App.settings.tmpLocation,
            path: tmpFile, // we'll have a different file name for each stream also if it's same torrent in same session
            buffer: (1.5 * 1024 * 1024).toString(), // create a buffer on torrent-stream
            index: torrent.file_index,
            name: torrent.info.infoHash,
            id: torrentPeerId
        });

        engine.swarm.piecesGot = 0;
        engine.swarm.cachedDownload = 0;
        engine.on('verify', function (index) {
            engine.swarm.piecesGot += 1;
        });

        var streamInfo = new App.Model.StreamInfo({
            engine: engine
        });

        // Fix for loading modal
        streamInfo.updateStats(engine);
        streamInfo.set('torrent', torrent);
        streamInfo.set('title', torrent.title);
        streamInfo.set('player', torrent.device);
        streamInfo.set('file_index', torrent.file_index);

        statsUpdater = setInterval(_.bind(streamInfo.updateStats, streamInfo, engine), 1000);
        stateModel.set('streamInfo', streamInfo);
        stateModel.set('state', 'connecting');
        watchState(stateModel);

        var checkReady = function () {
            if (stateModel.get('state') === 'ready') {

                if (stateModel.get('state') === 'ready' && stateModel.get('streamInfo').get('player') && stateModel.get('streamInfo').get('player').id !== 'local') {
                    stateModel.set('state', 'playingExternally');
                }
                streamInfo.set(torrent);

                // we need subtitle in the player
                streamInfo.set('subtitle', subtitles != null ? subtitles : torrent.subtitle);

                // clear downloaded so change:downloaded gets triggered for the first time
                streamInfo.set('downloaded', 0);

                App.vent.trigger('stream:ready', streamInfo);
                stateModel.destroy();
            }
        };

        App.vent.on('subtitle:downloaded', function (sub) {
            if (sub) {
                stateModel.get('streamInfo').set('subFile', sub);
                App.vent.trigger('subtitle:convert', {
                    path: sub,
                    language: torrent.defaultSubtitle
                }, function (err, res) {
                    if (err) {
                        win.error('error converting subtitles', err);
                        stateModel.get('streamInfo').set('subFile', null);
                    } else {
                        App.Subtitles.Server.start(res);
                    }
                });
            }
            downloadedSubtitles = true;
        });

        engine.server.on('listening', function () {
            if (engine) {
                streamInfo.set('src', 'http://127.0.0.1:' + engine.server.address().port + '/');
                streamInfo.set('type', 'video/mp4');
                stateModel.on('change:state', checkReady);
                checkReady();
            }
        });

        // piecesGot before ready means the cache we already have
        engine.on('ready', function () {
            if (engine) {
                engine.swarm.cachedDownload = engine.swarm.piecesGot * (engine.torrent.pieceLength || 0);
            }
        });

        engine.on('uninterested', function () {
            if (engine) {
                engine.swarm.pause();
            }

        });

        engine.on('interested', function () {
            if (engine) {
                engine.swarm.resume();
            }
        });

    };


    var Preload = {
        start: function (model) {

            if (Streamer.currentTorrent && model.get('torrent') === Streamer.currentTorrent.get('torrent')) {
                return;
            }
            this.currentTorrent = model;

            win.debug('Preloading model:', model.get('title'));
            var torrent_url = model.get('torrent');

            readTorrent(torrent_url, function (err, torrent) {

                win.debug('Preloading torrent:', torrent.name);
                var tmpFilename = torrent.infoHash;
                tmpFilename = tmpFilename.replace(/([^a-zA-Z0-9-_])/g, '_'); // +'-'+ (new Date()*1);
                var tmpFile = path.join(App.settings.tmpLocation, tmpFilename);
                subtitles = torrent.subtitle;

                var torrentPeerId = crypto.pseudoRandomBytes(10).toString('hex');

                win.debug('Preloading movie to %s', tmpFile);

                preload_engine = peerflix(torrent_url, {
                    connections: parseInt(Settings.connectionLimit, 10) || 100, // Max amount of peers to be connected to.
                    dht: parseInt(Settings.dhtLimit, 10) || 50,
                    port: 0,
                    tmp: App.settings.tmpLocation,
                    path: tmpFile, // we'll have a different file name for each stream also if it's same torrent in same session
                    index: torrent.file_index,
                    id: torrentPeerId
                });

            });


        },

        stop: function () {

            if (preload_engine) {
                if (preload_engine.server._handle) {
                    preload_engine.server.close();
                }
                preload_engine.destroy();
                win.info('Preloading stopped');
            }

            preload_engine = null;
        }
    };

    var Streamer = {
        start: function (model) {
            var torrentUrl = model.get('torrent');
            var torrent_read = false;
            if (model.get('torrent_read')) {
                torrent_read = true;
            }

            var stateModel = new Backbone.Model({
                state: 'connecting',
                backdrop: model.get('backdrop'),
                title: '',
                player: '',
                show_controls: false
            });
            App.vent.trigger('stream:started', stateModel);

            if (engine) {
                Streamer.stop();
            }

            this.stop_ = false;
            var that = this;
            var doTorrent = function (err, torrent) {
                // Return if streaming was cancelled while loading torrent
                if (that.stop_) {
                    return;
                }
                if (err) {
                    win.error('Streamer:', err.message);
                    App.vent.trigger('stream:stop');
                    App.vent.trigger('player:close');
                } else {
                    // did we need to extract subtitle ?
                    var extractSubtitle = model.get('extract_subtitle');

                    var getSubtitles = function (data) {
                        win.debug('Subtitles data request:', data);

                        var subtitleProvider = App.Config.getProvider('tvshowsubtitle');

                        subtitleProvider.fetch(data).then(function (subs) {
                            if (subs && Object.keys(subs).length > 0) {
                                subtitles = subs;
                                win.info(Object.keys(subs).length + ' subtitles found');
                            } else {
                                subtitles = null;
                                hasSubtitles = true;
                                downloadedSubtitles = true;
                                win.warn('No subtitles returned');
                            }
                            hasSubtitles = true;
                        }).catch(function (err) {
                            subtitles = null;
                            hasSubtitles = true;
                            downloadedSubtitles = true;
                            win.error('subtitleProvider.fetch()', err);
                        });
                    };

                    var handleTorrent_fnc = function () {
                        // TODO: We should passe the movie / tvshow imdbid instead
                        // and read from the player
                        // so from there we can use the previous next etc
                        // and use all available function with the right imdb id

                        var torrentInfo = {
                            info: torrent,
                            subtitle: model.get('subtitle'),
                            defaultSubtitle: model.get('defaultSubtitle'),
                            title: title,
                            tvdb_id: model.get('tvdb_id'),
                            imdb_id: model.get('imdb_id'),
                            episode_id: model.get('episode_id'),
                            episode: model.get('episode'),
                            season: model.get('season'),
                            file_index: model.get('file_index'),
                            quality: model.get('quality'),
                            device: model.get('device'),
                            cover: model.get('cover'),
                            episodes: model.get('episodes'),
                            auto_play: model.get('auto_play'),
                            auto_id: model.get('auto_id'),
                            auto_play_data: model.get('auto_play_data')
                        };

                        handleTorrent(torrentInfo, stateModel);
                    };

                    if (typeof extractSubtitle === 'object') {
                        extractSubtitle.filename = torrent.name;

                        var subskw = [];
                        for (var key in App.Localization.langcodes) {
                            if (App.Localization.langcodes[key].keywords !== undefined) {
                                subskw[key] = App.Localization.langcodes[key].keywords;
                            }
                        }
                        extractSubtitle.keywords = subskw;

                        getSubtitles(extractSubtitle);
                    }

                    if (model.get('type') === 'movie') {
                        hasSubtitles = true;
                    }

                    //Try get subtitles for custom torrents
                    var title = model.get('title');

                    if (!title) { //From ctrl+v magnet or drag torrent
                        for (var f in torrent.files) {
                            torrent.files[f].index = f;
                            if (isVideo(torrent.files[f].name)) {
                                torrent.files[f].display = true;
                            } else {
                                torrent.files[f].display = false;
                            }
                        }
                        if (torrent.files && torrent.files.length > 0 && !model.get('file_index') && model.get('file_index') !== 0) {
                            torrent.files = $.grep(torrent.files, function (n) {
                                return (n);
                            });
                            var fileModel = new Backbone.Model({
                                torrent: torrent,
                                files: torrent.files
                            });
                            App.vent.trigger('system:openFileSelector', fileModel);
                        } else {
                            model.set('defaultSubtitle', Settings.subtitle_language);
                            var sub_data = {};
                            if (torrent.name) { // sometimes magnets don't have names for some reason
                                var torrentMetadata;
                                if (torrent.info && torrent.info.name) {
                                    torrentMetadata = torrent.info.name.toString();
                                }
                                Common.matchTorrent(torrent.name, torrentMetadata)
                                    .then(function (res) {
                                        if (res.error) {
                                            win.warn(res.error);
                                            sub_data.filename = res.filename;
                                            title = res.filename;
                                            getSubtitles(sub_data);
                                            handleTorrent_fnc();
                                        } else {
                                            switch (res.type) {
                                            case 'movie':
                                                $('.loading-background').css('background-image', 'url(' + res.movie.image + ')');
                                                sub_data.imdbid = res.movie.imdbid;
                                                model.set('quality', res.quality);
                                                model.set('imdb_id', sub_data.imdbid);
                                                title = res.movie.title;
                                                break;
                                            case 'episode':
                                                $('.loading-background').css('background-image', 'url(' + res.show.episode.image + ')');
                                                sub_data.imdbid = res.show.imdbid;
                                                sub_data.season = res.show.episode.season;
                                                sub_data.episode = res.show.episode.episode;
                                                model.set('quality', res.quality);
                                                model.set('tvdb_id', res.show.tvdbid);
                                                model.set('episode_id', res.show.episode.tvdbid);
                                                model.set('imdb_id', res.show.imdbid);
                                                model.set('episode', sub_data.episode);
                                                model.set('season', sub_data.season);
                                                title = res.show.title + ' - ' + i18n.__('Season %s', res.show.episode.season) + ', ' + i18n.__('Episode %s', res.show.episode.episode) + ' - ' + res.show.episode.title;
                                                break;
                                            default:
                                                sub_data.filename = res.filename;
                                            }
                                            getSubtitles(sub_data);
                                            handleTorrent_fnc();
                                        }
                                    })
                                    .catch(function (err) {
                                        title = $.trim(torrent.name.replace('[rartv]', '').replace('[PublicHD]', '').replace('[ettv]', '').replace('[eztv]', '')).replace(/[\s]/g, '.');
                                        sub_data.filename = title;
                                        win.error('An error occured while trying to get metadata and subtitles', err);
                                        getSubtitles(sub_data);
                                        handleTorrent_fnc(); //try and force play
                                    });

                            } else {
                                hasSubtitles = true;
                                handleTorrent_fnc();
                            }
                        }
                    } else {
                        handleTorrent_fnc();
                    }
                }
            };
            // HACK(xaiki): we need to go through parse torrent
            // if we have a torrent and not an http source, this
            // is fragile as shit.
            if (typeof (torrentUrl) === 'string' && torrentUrl.substring(0, 7) === 'http://' && !torrentUrl.match('\\.torrent') && !torrentUrl.match('\\.php?')) {
                return Streamer.startStream(model, torrentUrl, stateModel);
            } else if (!torrent_read) {
                readTorrent(torrentUrl, doTorrent);
            } else {
                doTorrent(null, model.get('torrent'));
            }


        },
        startStream: function (model, url, stateModel) {
            var si = new App.Model.StreamInfo({});
            si.set('title', url);
            si.set('subtitle', {});
            si.set('type', 'video/mp4');
            si.set('device', model.get('device'));

            si.set('src', [{
                type: 'video/mp4',
                src: url
            }]);
            App.vent.trigger('stream:ready', si);
        },

        stop: function () {
            this.stop_ = true;
            if (engine) {
                // update ratio
                AdvSettings.set('totalDownloaded', Settings.totalDownloaded + engine.swarm.downloaded);
                AdvSettings.set('totalUploaded', Settings.totalUploaded + engine.swarm.uploaded);

                if (engine.server._handle) {
                    engine.server.close();
                }
                engine.destroy();
            }
            clearInterval(statsUpdater);
            statsUpdater = null;
            engine = null;
            subtitles = null; // reset subtitles to make sure they will not be used in next session.
            hasSubtitles = false;
            downloadedSubtitles = false;
            subtitleDownloading = false;
            App.vent.off('subtitle:downloaded');
            win.info('Streaming cancelled');
        }
    };

    App.vent.on('preload:start', Preload.start);
    App.vent.on('preload:stop', Preload.stop);
    App.vent.on('stream:start', Streamer.start);
    App.vent.on('stream:stop', Streamer.stop);

})(window.App);
