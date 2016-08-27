<?php

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Filesystem\FilesystemAdapter;
use Mockery as M;

class UploadManagementTest extends TestCase
{
    use DatabaseMigrations;

    /**
     * The user model.
     *
     * @var App\Models\User
     */
    private $user;

    /**
     * A partial mock of the Null adaptor.
     * @var Mockery\Mock
     */
    private $adaptor;

    /**
     * Create the user model test subject.
     *
     * @before
     * @return void
     */
    public function setupUserAndMock()
    {
        $this->actingAs(
            $this->user = factory(App\Models\User::class)->create()
        );

        Storage::shouldReceive('disk')->andReturn(
            new FilesystemAdapter(
                new League\Flysystem\Filesystem(
                    $this->adaptor = M::mock('League\Flysystem\Adapter\NullAdapter')->makePartial()
                )
            )
        );
    }

    public function testItCreatesFolders()
    {
        $this->adaptor
            ->shouldReceive('createDir')
            ->once()->with('Foo', M::any())
            ->passthru();

        $this->visit(route('admin/upload'))
            ->type('Foo', 'new_folder')
            ->press('Save')
            ->see('Success! New Folder has been created.');
    }

    public function testItShowsErrorIfCreatingFolderFailed()
    {
        $this->adaptor
            ->shouldReceive('createDir')
            ->once()->with('Foo', M::any())
            ->andReturn(false);

        $this->visit(route('admin/upload'))
            ->type('Foo', 'new_folder')
            ->press('Save')
            ->see('Sorry! An error occurred creating directory');
    }

    public function testItShowErrorIfFolderExists()
    {
        $this->adaptor
            ->shouldReceive('has')
            ->once()->with('Foo')
            ->andReturn(true);

        $this->visit(route('admin/upload'))
            ->type('Foo', 'new_folder')
            ->press('Save')
            ->see("Folder '/Foo' aleady exists");
    }

    public function testItDeletesFolders()
    {
        $this->adaptor
            ->shouldReceive('deleteDir')
            ->once()->with('Foo')
            ->andReturn(true);

        // since the form required js events we will just make the http request on this one
        $this->delete('/admin/upload/folder', ['del_folder' => 'Foo'])
            ->seeInSession('_delete-folder', 'Success! Folder has been deleted.');
    }

    public function ignore_testItStoresFiles()
    {
        // since the helper methods don't work when there are multiple forms with the same
        // button test we have to do do a little more work here
        $tmpFile = '/tmp/canvas-test-'.date('Y-m-d H:i:s').'.txt';
        $testContent = 'bar';
        File::put($tmpFile, $testContent);

        $this->adaptor
            ->shouldReceive('write')->once()->with('foo.txt', 'bar', M::any())
            ->passthru();

        $this->visit(route('admin/upload'));
        $this->uploads['file'] = $tmpFile;
        $form = $this->crawler()->filter('#fileCreate')->form()->setValues([
            'file'      => $tmpFile,
            'file_name' => 'foo',
        ]);

        $this->makeRequestUsingForm($form, $this->uploads)
            ->see('Success! New file has been uploaded.');

        File::delete($tmpFile);
    }

    public function testItDeletesFiles()
    {
        $this->adaptor
            ->shouldReceive('has')->atLeast()->once()->with('Foo')
            ->andReturn(true);

        $this->adaptor
            ->shouldReceive('delete')->once()->with('Foo')
            ->andReturn(true);

        $this->delete('/admin/upload/file', ['del_file' => 'Foo'])
            ->seeInSession('_delete-file', 'Success! File has been deleted.');
    }
}
